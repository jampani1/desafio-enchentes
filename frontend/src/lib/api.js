const BASE_URL = import.meta.env.VITE_API_URL

export class ApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

function getToken() {
  return localStorage.getItem("token")
}

async function request(method, path, { body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" }
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError("Sem conexao com o servidor.", { status: 0 })
  }

  if (res.status === 204) return null

  let data = null
  try {
    data = await res.json()
  } catch {
    // resposta sem JSON valido
  }

  if (!res.ok) {
    const msg = data?.erro || `Erro ${res.status}`
    throw new ApiError(msg, { status: res.status, body: data })
  }

  return data
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, { body }),
  put: (path, body) => request("PUT", path, { body }),
  del: (path) => request("DELETE", path),
  unauth: {
    get: (path) => request("GET", path, { auth: false }),
    post: (path, body) => request("POST", path, { body, auth: false }),
  },
}
