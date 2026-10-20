function timingSafeEqual(left, right) {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  let difference = a.length ^ b.length;

  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    difference |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }

  return difference === 0;
}

function isAuthorized(request, expectedPassword) {
  const authorization = request.headers.get("Authorization") ?? "";
  const match = authorization.match(/^Basic\s+(.+)$/i);

  if (!match) return false;

  try {
    const bytes = Uint8Array.from(atob(match[1]), (character) =>
      character.charCodeAt(0),
    );
    const credentials = new TextDecoder().decode(bytes);
    const separator = credentials.indexOf(":");

    return (
      separator !== -1 &&
      timingSafeEqual(credentials.slice(separator + 1), expectedPassword)
    );
  } catch {
    return false;
  }
}

export default {
  async fetch(request, env) {
    if (!env.APP_PASSWORD) {
      return new Response("Authentication is not configured.", {
        status: 500,
      });
    }

    if (!isAuthorized(request, env.APP_PASSWORD)) {
      return new Response("Unauthorized", {
        status: 401,
        headers: {
          "WWW-Authenticate": 'Basic realm="AE Chrono Log", charset="UTF-8"',
          "Cache-Control": "no-store",
        },
      });
    }
    
const url = new URL(request.url);

if (url.pathname === "/api/transactions" && request.method === "GET") {
  try {
    const { results } = await env.DB
      .prepare(
        "SELECT id, type, amount, category, transaction_date, note, created_at FROM transactions ORDER BY transaction_date DESC, id DESC LIMIT 100",
      )
      .all();

    return Response.json(results, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Could not load transactions" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

if (url.pathname === "/api/transactions" && request.method === "POST") {
  let transaction;

  try {
    transaction = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const type = transaction?.type;
  const amount = transaction?.amount;
  const categoryValue = transaction?.category;
  const category =
    typeof categoryValue === "string" ? categoryValue.trim() : "";
  const transactionDate = transaction?.transaction_date;
  const note = transaction?.note ?? null;
  const parsedDate = new Date(`${transactionDate}T00:00:00.000Z`);
  const validDate =
    typeof transactionDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(transactionDate) &&
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === transactionDate;

  if (
    !["income", "expense"].includes(type) ||
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    typeof category !== "string" ||
    category.length === 0 ||
    category.length > 100 ||
    !validDate ||
    (note !== null && (typeof note !== "string" || note.length > 2000))
  ) {
    return Response.json(
      { error: "Invalid transaction fields" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await env.DB
      .prepare(
        "INSERT INTO transactions (type, amount, category, transaction_date, note) VALUES (?, ?, ?, ?, ?)",
      )
      .bind(type, amount, category, transactionDate, note)
      .run();

    return Response.json(
      { ok: true, id: result.meta.last_row_id },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Could not save transaction" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

if (url.pathname === "/api/notes" && request.method === "GET") {
  try {
    const { results } = await env.DB
      .prepare(
        "SELECT id, title, content, note_date, created_at FROM notes ORDER BY note_date DESC, id DESC LIMIT 100",
      )
      .all();

    return Response.json(results, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json(
      { error: "Could not load notes" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

if (url.pathname === "/api/notes" && request.method === "POST") {
  let note;

  try {
    note = await request.json();
  } catch {
    return Response.json(
      { error: "Request body must be valid JSON" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const title = typeof note?.title === "string" ? note.title.trim() : "";
  const content = note?.content;
  const noteDate = note?.note_date;
  const parsedDate = new Date(`${noteDate}T00:00:00.000Z`);
  const validDate =
    typeof noteDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(noteDate) &&
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === noteDate;

  if (
    title.length === 0 ||
    title.length > 200 ||
    typeof content !== "string" ||
    content.trim().length === 0 ||
    content.length > 50000 ||
    !validDate
  ) {
    return Response.json(
      { error: "Invalid note fields" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const result = await env.DB
      .prepare(
        "INSERT INTO notes (title, content, note_date) VALUES (?, ?, ?)",
      )
      .bind(title, content, noteDate)
      .run();

    return Response.json(
      { ok: true, id: result.meta.last_row_id },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Could not save note" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

if (url.pathname === "/api/summary" && request.method === "GET") {
  const requestedMonth = url.searchParams.get("month");
  const month = requestedMonth ?? new Date().toISOString().slice(0, 7);

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return Response.json(
      { error: "Month must use YYYY-MM format" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const startDate = `${month}-01`;
  const [year, monthNumber] = month.split("-").map(Number);
  const nextMonthDate = new Date(Date.UTC(year, monthNumber, 1));
  const endDate = nextMonthDate.toISOString().slice(0, 10);

  try {
    const { results } = await env.DB
      .prepare(
        "SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income, COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense FROM transactions WHERE transaction_date >= ? AND transaction_date < ?",
      )
      .bind(startDate, endDate)
      .all();

    const { results: categoryResults } = await env.DB
      .prepare(
        "SELECT type, category, SUM(amount) AS total FROM transactions WHERE transaction_date >= ? AND transaction_date < ? GROUP BY type, category ORDER BY type, total DESC, category",
      )
      .bind(startDate, endDate)
      .all();

    const { income, expense } = results[0];

    return Response.json(
      {
        month,
        income,
        expense,
        balance: income - expense,
        by_category: categoryResults,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Could not load monthly summary" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

if (url.pathname === "/api/check-db") {
  try {
    const { results } = await env.DB
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('transactions', 'notes') ORDER BY name",
      )
      .all();

    return Response.json(
      { ok: true, tables: results.map((row) => row.name) },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { ok: false, error: "Database query failed" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

return new Response("Hello World!", {
  headers: { "Cache-Control": "no-store" },
});
  },
};