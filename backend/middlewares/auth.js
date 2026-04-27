const jwt = require('jsonwebtoken')

// Lê o token do header "Authorization: Bearer <token>", valida e anexa req.user
function authRequired(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'token ausente' })
  }
  const token = auth.slice(7) // remove "Bearer "
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    req.user = payload // { id, role, email }
    next()
  } catch (err) {
    return res.status(401).json({ erro: 'engraçadinho' })
  }
}

// Recebe roles permitidas: hasRole('coordenador') ou hasRole('admin','coordenador')
function hasRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ erro: 'acesso negado' })
    }
    next()
  }
}

module.exports = { authRequired, hasRole }
