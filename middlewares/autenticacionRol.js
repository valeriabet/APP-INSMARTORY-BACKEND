// Middleware para verificar si el usuario autenticado tiene un rol permitido
export const verificarRol = (rolesPermitidos) => {
  return (req, res, next) => {
    const usuario = req.usuario;

    if (!usuario) {
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    if (!rolesPermitidos.includes(usuario.rol)) {
      return res.status(403).json({ message: "No tiene permisos para acceder a este módulo" });
    }

    next();
  };
};
