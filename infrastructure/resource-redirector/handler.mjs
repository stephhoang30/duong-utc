import { timingSafeEqual } from "node:crypto";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";

const s3 = new S3Client({});
const ssm = new SSMClient({});
const signedUrlLifetimeSeconds = 300;
let accessTokenPromise;

function json(statusCode, message) {
  return {
    statusCode,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ message }),
  };
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left ?? "", "utf8");
  const rightBuffer = Buffer.from(right ?? "", "utf8");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

async function getAccessToken() {
  if (!accessTokenPromise) {
    accessTokenPromise = ssm.send(new GetParameterCommand({
      Name: process.env.ACCESS_TOKEN_PARAMETER,
      WithDecryption: true,
    })).then(({ Parameter }) => {
      if (!Parameter?.Value) throw new Error("Resource access token is empty");
      return Parameter.Value;
    }).catch((error) => {
      accessTokenPromise = undefined;
      throw error;
    });
  }
  return accessTokenPromise;
}

function getObjectKey(rawPath) {
  try {
    const decodedPath = decodeURIComponent(rawPath ?? "");
    const segments = decodedPath.split("/");
    if (
      !decodedPath.startsWith("/resources/") ||
      decodedPath.includes("\0") ||
      decodedPath.includes("\\") ||
      segments.some((segment) => segment === "." || segment === "..")
    ) return null;
    return decodedPath.slice(1);
  } catch {
    return null;
  }
}

export async function handler(event) {
  const method = event?.requestContext?.http?.method ?? "GET";
  if (method !== "GET") return json(405, "Chỉ hỗ trợ yêu cầu GET.");

  const key = getObjectKey(event?.rawPath);
  if (!key) return json(404, "Không tìm thấy tài liệu.");

  try {
    const expectedToken = await getAccessToken();
    if (!safeEqual(event?.queryStringParameters?.access, expectedToken)) {
      return json(403, "Không có quyền mở tài liệu.");
    }

    const signedUrl = await getSignedUrl(s3, new GetObjectCommand({
      Bucket: process.env.RESOURCE_BUCKET,
      Key: key,
    }), { expiresIn: signedUrlLifetimeSeconds });

    return {
      statusCode: 302,
      headers: {
        "cache-control": "no-store",
        location: signedUrl,
      },
      body: "",
    };
  } catch (error) {
    console.error(JSON.stringify({
      level: "error",
      message: "Unable to create resource URL",
      error: error instanceof Error ? error.message : "Unknown error",
    }));
    return json(500, "Chưa thể mở tài liệu. Vui lòng thử lại.");
  }
}
