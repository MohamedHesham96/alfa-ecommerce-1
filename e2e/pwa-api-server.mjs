import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const PORT = 8787;
const stats = { orders: 0, addLine: 0 };

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers":
    "Authorization, Accept-Language, Content-Type, Accept, Cache-Control",
  "Access-Control-Max-Age": "600",
  Vary: "Origin",
};

function send(response, status, payload, extraHeaders = {}) {
  const body = typeof payload === "string" ? payload : JSON.stringify(payload);
  response.writeHead(status, {
    ...CORS_HEADERS,
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-cache",
    ...extraHeaders,
  });
  response.end(body);
}

function product(index = 1) {
  return {
    itemId: index,
    seoCode: index === 1 ? "e2e-product" : `e2e-product-${index}`,
    nameAr: `منتج تجريبي ${index}`,
    nameEn: `E2E Product ${index}`,
    descriptionAr: "منتج لاختبارات PWA",
    descriptionEn: "PWA test product",
    price: 100 + index,
    oldPrice: 120 + index,
    available: true,
    active: true,
    averageRating: 4,
    code: `E2E-${index}`,
    images: [{ imageUrl: "/Images/img2.png" }],
    itemCategory: {
      itemCategoryId: 1,
      nameAr: "إلكترونيات",
      nameEn: "Electronics",
      seoCode: "electronics",
    },
  };
}

function products(count = 12) {
  return Array.from({ length: count }, (_, index) => product(index + 1));
}

const server = http.createServer((request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, CORS_HEADERS);
    response.end();
    return;
  }

  const url = new URL(request.url || "/", `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (pathname === "/health") {
    send(response, 200, { ok: true });
    return;
  }

  if (pathname === "/__test/stats") {
    send(response, 200, stats);
    return;
  }

  if (pathname === "/__test/reset" && request.method === "POST") {
    stats.orders = 0;
    stats.addLine = 0;
    send(response, 200, stats);
    return;
  }

  if (pathname === "/api/public/contact") {
    send(response, 200, {
      data: { whatsappURL: "https://wa.me/201000000000" },
    });
    return;
  }

  if (pathname === "/api/public/itemCategory/all") {
    send(response, 200, { data: [] });
    return;
  }

  if (pathname === "/api/public/sliderImages") {
    send(response, 200, {
      data: [
        {
          sliderImageId: 1,
          imageUrl: "/Images/img2.png",
          titleAr: "عرض تجريبي",
          titleEn: "Demo slide",
          itemId: 1,
        },
      ],
    });
    return;
  }

  if (pathname.startsWith("/images/Images/")) {
    try {
      const requested = pathname.replace(/^\/images\//, "");
      const imagePath = requested.includes("/thumb_")
        ? path.join(
            process.cwd(),
            "public",
            requested.replace("thumb_", ""),
          )
        : path.join(process.cwd(), "public", requested);
      const image = fs.readFileSync(imagePath);
      response.writeHead(200, {
        ...CORS_HEADERS,
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=60",
      });
      response.end(image);
    } catch {
      send(response, 404, { message: "Image not found" });
    }
    return;
  }

  if (pathname === "/api/public/offers") {
    send(response, 200, { data: [] });
    return;
  }

  if (pathname === "/api/public/items/recent") {
    send(response, 200, { data: products(10) });
    return;
  }

  if (pathname.startsWith("/api/public/items/topRated/category/")) {
    send(response, 200, { data: { content: products(10) } });
    return;
  }

  if (pathname.startsWith("/api/public/items/top")) {
    send(response, 200, { data: { content: products(10) } });
    return;
  }

  if (pathname === "/api/public/items/1" || pathname === "/api/public/items") {
    send(response, 200, { data: product(1) });
    return;
  }

  if (pathname.startsWith("/api/public/items/search")) {
    send(response, 200, {
      data: { content: products(12), totalElements: 12, totalPages: 1 },
    });
    return;
  }

  if (pathname === "/api/users" && request.method === "GET") {
    if (!request.headers.authorization) {
      send(response, 401, { message: "Unauthorized" });
      return;
    }
    send(response, 200, {
      data: {
        userId: 1,
        firstName: "E2E",
        lastName: "User",
        username: "e2e",
        email: "e2e@example.com",
        phone: "01000000000",
        address: "Test address",
        governorate: { governorateId: 1, nameAr: "القاهرة", nameEn: "Cairo" },
      },
    });
    return;
  }

  if (pathname === "/api/users" && request.method === "PUT") {
    send(response, 200, { message: "ok", success: true });
    return;
  }

  if (pathname === "/api/shopCarts" && request.method === "GET") {
    send(response, 200, {
      data: {
        itemLines: [],
        total: 0,
        totalDiscount: 0,
        shippingCost: 0,
        netTotal: 0,
        user: {
          address: "Test address",
          governorate: { nameAr: "القاهرة", nameEn: "Cairo" },
        },
      },
    });
    return;
  }

  if (pathname === "/api/shopCarts/addLine" && request.method === "POST") {
    stats.addLine += 1;
    send(response, 200, { message: "ok", success: true });
    return;
  }

  if (pathname === "/api/shopCarts/changeQuantity") {
    send(response, 200, { message: "ok", success: true });
    return;
  }

  if (pathname.startsWith("/api/shopCarts/deleteLine/")) {
    send(response, 200, { message: "ok", success: true });
    return;
  }

  if (pathname === "/api/users/orders/place-order" && request.method === "POST") {
    stats.orders += 1;
    send(response, 200, { message: "Order placed", success: true });
    return;
  }

  if (pathname.startsWith("/api/orders")) {
    send(response, 200, {
      data: { content: [], totalElements: 0, totalPages: 0 },
    });
    return;
  }

  if (pathname.startsWith("/api/public/")) {
    send(response, 200, { data: null });
    return;
  }

  send(response, 404, { message: "Not found", path: pathname });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`[PWA E2E] mock API listening on http://localhost:${PORT}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
