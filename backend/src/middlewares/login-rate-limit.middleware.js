function crearLimitadorLogin({ maxIntentos = 10, ventanaMs = 15 * 60 * 1000, maxLlaves = 10000, ahora = Date.now } = {}) {
  const ventanas = new Map();

  return function limitarLogin(req, res, next) {
    const ip = req.ip || req.socket?.remoteAddress || 'desconocida';
    const tiempo = ahora();
    let registro = ventanas.get(ip);

    if (!registro || tiempo - registro.inicio >= ventanaMs) {
      if (ventanas.size >= maxLlaves) {
        for (const [llave, valor] of ventanas) {
          if (tiempo - valor.inicio >= ventanaMs) ventanas.delete(llave);
        }
        if (ventanas.size >= maxLlaves) ventanas.delete(ventanas.keys().next().value);
      }
      registro = { inicio: tiempo, intentos: 0 };
      ventanas.set(ip, registro);
    }

    registro.intentos += 1;
    if (registro.intentos > maxIntentos) {
      const segundos = Math.max(1, Math.ceil((registro.inicio + ventanaMs - tiempo) / 1000));
      res.set('Retry-After', String(segundos));
      return res.status(429).json({ mensaje: 'Demasiados intentos. Intenta de nuevo más tarde.' });
    }

    return next();
  };
}

module.exports = { crearLimitadorLogin };
