"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Icon, type IconName } from "./icons";

type FontSize = "compact" | "comfortable" | "large";
type StudentProfile = {
  fullName: string;
  displayName: string;
  birthday: string;
  studentId: string;
  course: string;
  className: string;
  major: string;
  email: string;
  phone: string;
  avatar: string;
};

const defaultProfile: StudentProfile = {
  fullName: "Nguyễn Ngọc Thùy Dương",
  displayName: "Thùy Dương",
  birthday: "2008-01-25",
  studentId: "261800139",
  course: "K67",
  className: "KT1",
  major: "Kinh tế",
  email: "",
  phone: "",
  avatar: "",
};

const profileStorageKey = "duong-planner-profile-v1";

function profileInitials(profile: StudentProfile) {
  const source = profile.displayName.trim() || profile.fullName.trim() || "D";
  return source.split(/\s+/).slice(-2).map((part) => part[0]).join("").toLocaleUpperCase("vi-VN");
}

function compressAvatar(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      reject(new Error("Hãy chọn ảnh PNG, JPG hoặc WebP."));
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      reject(new Error("Ảnh gốc cần nhỏ hơn 8 MB."));
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const size = 384;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Thiết bị không thể xử lý ảnh này."));
        return;
      }
      const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
      if (!sourceSize) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Ảnh không có kích thước hợp lệ."));
        return;
      }
      const sourceX = (image.naturalWidth - sourceSize) / 2;
      const sourceY = (image.naturalHeight - sourceSize) / 2;
      context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/webp", 0.82));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Không đọc được ảnh. Hãy thử một ảnh khác."));
    };
    image.src = objectUrl;
  });
}

const fontOptions: { value: FontSize; label: string; sample: string }[] = [
  { value: "compact", label: "Gọn", sample: "A" },
  { value: "comfortable", label: "Vừa", sample: "A" },
  { value: "large", label: "Lớn", sample: "A" },
];

const navigation: { href: string; label: string; short: string; icon: IconName }[] = [
  { href: "/", label: "Tổng quan", short: "Trang chủ", icon: "home" },
  { href: "/planner", label: "Kế hoạch", short: "Kế hoạch", icon: "calendar" },
  { href: "/notes", label: "Sổ tay", short: "Sổ tay", icon: "notebook" },
  { href: "/review", label: "Từ vựng", short: "Từ vựng", icon: "review" },
  { href: "/exams", label: "Phòng thi", short: "Bài thi", icon: "exam" },
  { href: "/chinese", label: "Tiếng Trung", short: "中文", icon: "language" },
  { href: "/library", label: "Thư viện", short: "Sách", icon: "bookmark" },
  { href: "/utc", label: "Cẩm nang UTC", short: "UTC", icon: "book" },
];

const mobileNavigation = navigation.filter((item) => ["/", "/planner", "/review", "/exams", "/chinese"].includes(item.href));

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [fontSize, setFontSize] = useState<FontSize>("comfortable");
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [profile, setProfile] = useState<StudentProfile>(defaultProfile);
  const [profileDraft, setProfileDraft] = useState<StudentProfile>(defaultProfile);
  const [profileMessage, setProfileMessage] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLButtonElement>(null);
  const profileNameRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const profileMeta = useMemo(() => [profile.course, profile.className].filter(Boolean).join(" · ") || "Hồ sơ sinh viên", [profile]);
  const closeProfileEditor = () => {
    setProfileEditorOpen(false);
    window.requestAnimationFrame(() => profileRef.current?.focus());
  };

  useEffect(() => {
    const saved = localStorage.getItem("duong-planner-theme");
    const initial = saved === "dark" || saved === "light"
      ? saved
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    setTheme(initial);
    document.documentElement.dataset.theme = initial;

    const savedFontSize = localStorage.getItem("duong-planner-font-size");
    const initialFontSize: FontSize = savedFontSize === "compact" || savedFontSize === "large" ? savedFontSize : "comfortable";
    setFontSize(initialFontSize);
    document.documentElement.dataset.fontSize = initialFontSize;

    try {
      const savedProfile = JSON.parse(localStorage.getItem(profileStorageKey) ?? "null") as Partial<StudentProfile> | null;
      if (savedProfile) {
        const nextProfile = { ...defaultProfile };
        (Object.keys(defaultProfile) as Array<keyof StudentProfile>).forEach((key) => {
          if (typeof savedProfile[key] === "string") nextProfile[key] = savedProfile[key];
        });
        setProfile(nextProfile);
        setProfileDraft(nextProfile);
      }
    } catch {
      localStorage.removeItem(profileStorageKey);
    }
  }, []);

  const applyTheme = (next: "light" | "dark") => {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("duong-planner-theme", next);
  };

  const applyFontSize = (next: FontSize) => {
    setFontSize(next);
    document.documentElement.dataset.fontSize = next;
    localStorage.setItem("duong-planner-font-size", next);
  };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setSettingsOpen(false);
      setProfileEditorOpen((wasOpen) => {
        if (wasOpen) window.requestAnimationFrame(() => profileRef.current?.focus());
        return false;
      });
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!settingsRef.current?.contains(target) && !profileRef.current?.contains(target)) setSettingsOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeOnOutsideClick);
  }, [settingsOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setSettingsOpen(false);
    setProfileEditorOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!profileEditorOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => profileNameRef.current?.focus());
    return () => { document.body.style.overflow = originalOverflow; };
  }, [profileEditorOpen]);

  const openProfileEditor = () => {
    setProfileDraft(profile);
    setProfileMessage("");
    setSettingsOpen(false);
    setProfileEditorOpen(true);
  };

  const updateProfileField = (field: keyof StudentProfile, value: string) => {
    setProfileDraft((current) => ({ ...current, [field]: value }));
    setProfileMessage("");
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAvatarBusy(true);
    setProfileMessage("");
    try {
      const avatar = await compressAvatar(file);
      updateProfileField("avatar", avatar);
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Không thể xử lý ảnh này.");
    } finally {
      setAvatarBusy(false);
      event.target.value = "";
    }
  };

  const saveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextProfile = Object.fromEntries(
      Object.entries(profileDraft).map(([key, value]) => [key, typeof value === "string" && key !== "avatar" ? value.trim() : value]),
    ) as StudentProfile;
    if (!nextProfile.fullName) {
      setProfileMessage("Dương cần nhập họ và tên trước khi lưu.");
      profileNameRef.current?.focus();
      return;
    }
    if (!nextProfile.displayName) nextProfile.displayName = nextProfile.fullName.split(/\s+/).slice(-2).join(" ");
    try {
      localStorage.setItem(profileStorageKey, JSON.stringify(nextProfile));
      setProfile(nextProfile);
      setProfileDraft(nextProfile);
      setProfileMessage("Đã lưu hồ sơ trên thiết bị này.");
      window.setTimeout(closeProfileEditor, 650);
    } catch {
      setProfileMessage("Bộ nhớ trình duyệt đã đầy. Hãy bỏ ảnh đại diện hoặc chọn ảnh khác rồi lưu lại.");
    }
  };

  return (
    <div className="app-frame">
      <a className="skip-link" href="#main-content">Bỏ qua điều hướng</a>
      <aside className={`sidebar ${menuOpen ? "is-open" : ""}`} aria-label="Điều hướng chính">
        <div className="brand">
          <span className="brand-mark"><Icon name="sparkle" size={21} /></span>
          <span><strong>Dương</strong><small>Study planner</small></span>
        </div>

        <nav className="side-nav">
          {navigation.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} className={active ? "active" : ""} href={item.href} aria-current={active ? "page" : undefined}>
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-quote">
          <Icon name="sparkle" size={18} />
          <p>Mỗi ngày tiến một chút cũng là đang tiến về phía trước.</p>
        </div>

        <div className="sidebar-footer">
          {settingsOpen && <div ref={settingsRef} className="settings-popover" id="planner-settings" role="dialog" aria-labelledby="settings-title">
            <div className="settings-heading">
              <span className="settings-heading-icon"><Icon name="user" size={18} /></span>
              <div><strong id="settings-title">Hồ sơ &amp; giao diện</strong><small>Thông tin cá nhân và cách hiển thị</small></div>
              <button className="ghost-icon" onClick={() => setSettingsOpen(false)} aria-label="Đóng cài đặt"><Icon name="x" size={18} /></button>
            </div>

            <div className="settings-profile-card">
              <div className="avatar settings-avatar">
                {profile.avatar ? <img src={profile.avatar} alt="" /> : profileInitials(profile)}
              </div>
              <div>
                <strong>{profile.displayName || profile.fullName}</strong>
                <small>{profileMeta}{profile.major ? ` · ${profile.major}` : ""}</small>
              </div>
              <button type="button" className="button secondary small" onClick={openProfileEditor}><Icon name="user" size={16} />Sửa hồ sơ</button>
            </div>

            <div className="settings-group">
              <span className="settings-label"><Icon name="text-size" size={17} />Cỡ chữ</span>
              <div className="font-size-options" role="group" aria-label="Chọn cỡ chữ">
                {fontOptions.map((option, index) => <button key={option.value} className={fontSize === option.value ? "active" : ""} onClick={() => applyFontSize(option.value)} aria-pressed={fontSize === option.value}>
                  <span style={{ fontSize: `${15 + index * 2}px` }}>{option.sample}</span>{option.label}
                </button>)}
              </div>
            </div>

            <div className="settings-group">
              <span className="settings-label"><Icon name={theme === "dark" ? "moon" : "sun"} size={17} />Giao diện</span>
              <div className="theme-options" role="group" aria-label="Chọn giao diện">
                <button className={theme === "light" ? "active" : ""} onClick={() => applyTheme("light")} aria-pressed={theme === "light"}><Icon name="sun" size={17} />Sáng</button>
                <button className={theme === "dark" ? "active" : ""} onClick={() => applyTheme("dark")} aria-pressed={theme === "dark"}><Icon name="moon" size={17} />Tối</button>
              </div>
            </div>
          </div>}

          <button ref={profileRef} className="sidebar-account" onClick={() => setSettingsOpen((value) => !value)} aria-expanded={settingsOpen} aria-controls="planner-settings" aria-haspopup="dialog">
            <div className="avatar">{profile.avatar ? <img src={profile.avatar} alt="" /> : profileInitials(profile)}</div>
            <span><strong>{profile.displayName || profile.fullName}</strong><small>{profileMeta}</small></span>
            <span className="account-settings" aria-hidden="true"><Icon name="settings" size={18} /></span>
          </button>
        </div>
      </aside>

      {menuOpen && <button className="sidebar-scrim" onClick={() => { setMenuOpen(false); setSettingsOpen(false); }} aria-label="Đóng menu" />}

      <div className="app-content">
        <header className="top-header">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Mở menu">
            <Icon name="menu" />
          </button>
          <strong className="mobile-title">Dương Planner</strong>
        </header>

        <main id="main-content" tabIndex={-1}>{children}</main>
      </div>

      <nav className="bottom-nav" aria-label="Điều hướng trên điện thoại">
        {mobileNavigation.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
              <Icon name={item.icon} size={21} />
              <span>{item.short}</span>
            </Link>
          );
        })}
      </nav>

      {profileEditorOpen && (
        <div className="profile-dialog-backdrop" onMouseDown={closeProfileEditor}>
          <section className="profile-dialog" role="dialog" aria-modal="true" aria-labelledby="profile-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="profile-dialog-heading">
              <div>
                <span className="eyebrow">Lưu riêng trên thiết bị</span>
                <h2 id="profile-dialog-title">Hồ sơ của Dương</h2>
                <p>Thông tin này chỉ dùng để cá nhân hóa planner, không được gửi lên mạng.</p>
              </div>
              <button type="button" className="icon-button" onClick={closeProfileEditor} aria-label="Đóng hồ sơ"><Icon name="x" /></button>
            </div>

            <form onSubmit={saveProfile}>
              <div className="profile-avatar-editor">
                <div className="avatar profile-avatar-preview">
                  {profileDraft.avatar ? <img src={profileDraft.avatar} alt={`Ảnh đại diện của ${profileDraft.displayName || profileDraft.fullName}`} /> : profileInitials(profileDraft)}
                </div>
                <div>
                  <strong>Ảnh đại diện</strong>
                  <p>Planner sẽ tự cắt vuông và nén ảnh để tải nhanh.</p>
                  <div className="profile-avatar-actions">
                    <button type="button" className="button secondary small" onClick={() => avatarInputRef.current?.click()} disabled={avatarBusy}><Icon name="camera" size={17} />{avatarBusy ? "Đang xử lý…" : "Chọn ảnh"}</button>
                    {profileDraft.avatar && <button type="button" className="button ghost small" onClick={() => updateProfileField("avatar", "")}>Bỏ ảnh</button>}
                  </div>
                  <input ref={avatarInputRef} className="sr-only" id="profile-avatar" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleAvatarChange} disabled={avatarBusy} />
                </div>
              </div>

              <div className="profile-form-grid">
                <label className="field span-2"><span>Họ và tên *</span><input ref={profileNameRef} value={profileDraft.fullName} onChange={(event) => updateProfileField("fullName", event.target.value)} autoComplete="name" required /></label>
                <label className="field"><span>Tên hiển thị</span><input value={profileDraft.displayName} onChange={(event) => updateProfileField("displayName", event.target.value)} placeholder="Thùy Dương" /></label>
                <label className="field"><span>Ngày sinh</span><input type="date" value={profileDraft.birthday} onChange={(event) => updateProfileField("birthday", event.target.value)} autoComplete="bday" /></label>
                <label className="field"><span>Mã sinh viên</span><input value={profileDraft.studentId} onChange={(event) => updateProfileField("studentId", event.target.value)} inputMode="numeric" /></label>
                <label className="field"><span>Khóa</span><input value={profileDraft.course} onChange={(event) => updateProfileField("course", event.target.value)} placeholder="K67" /></label>
                <label className="field"><span>Lớp</span><input value={profileDraft.className} onChange={(event) => updateProfileField("className", event.target.value)} placeholder="KT1" /></label>
                <label className="field"><span>Ngành học</span><input value={profileDraft.major} onChange={(event) => updateProfileField("major", event.target.value)} placeholder="Kinh tế" /></label>
                <label className="field"><span>Email</span><input type="email" value={profileDraft.email} onChange={(event) => updateProfileField("email", event.target.value)} autoComplete="email" inputMode="email" /></label>
                <label className="field"><span>Điện thoại</span><input type="tel" value={profileDraft.phone} onChange={(event) => updateProfileField("phone", event.target.value)} autoComplete="tel" inputMode="tel" /></label>
              </div>

              <div className="profile-dialog-footer">
                <p className={profileMessage.startsWith("Đã lưu") ? "is-success" : ""} role="status" aria-live="polite">{profileMessage}</p>
                <div>
                  <button type="button" className="button ghost" onClick={closeProfileEditor}>Hủy</button>
                  <button type="submit" className="button primary" disabled={avatarBusy}><Icon name="save" size={18} />Lưu hồ sơ</button>
                </div>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
