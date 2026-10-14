const datosPorDefecto = [
  { x: 3, y: 4 },
  { x: 5, y: 7 },
  { x: 6, y: 6 },
  { x: 8, y: 10 },
  { x: 9, y: 12 },
  { x: 11, y: 13 },
  { x: 12, y: 15 },
  { x: 14, y: 17 },
  { x: 16, y: 19 },
  { x: 18, y: 22 }
];

let datos = datosPorDefecto.map(function (fila) { return { x: fila.x, y: fila.y }; });
let modeloActual = null;
let graficaModelo = null;
let graficaX = null;
let graficaY = null;

const cuerpoTablaDatos = document.getElementById("cuerpo-tabla-datos");
const botonAgregarFila = document.getElementById("boton-agregar-fila");
const botonCalcular = document.getElementById("boton-calcular");
const botonPredecir = document.getElementById("boton-predecir");
const inputXPrediccion = document.getElementById("input-x-prediccion");
const resultadoPrediccion = document.getElementById("resultado-prediccion");
const contenedorProcedimiento = document.getElementById("contenedor-procedimiento");

function renderizarTablaDatos() {
  cuerpoTablaDatos.innerHTML = "";

  datos.forEach(function (fila, indice) {
    const renglon = document.createElement("tr");

    renglon.innerHTML =
      "<td>" + (indice + 1) + "</td>" +
      "<td><input type='number' step='any' class='input-x' data-indice='" + indice + "' value='" + fila.x + "'></td>" +
      "<td><input type='number' step='any' class='input-y' data-indice='" + indice + "' value='" + fila.y + "'></td>" +
      "<td><button class='boton-secundario boton-eliminar-fila' data-indice='" + indice + "'>Quitar</button></td>";

    cuerpoTablaDatos.appendChild(renglon);
  });

  cuerpoTablaDatos.querySelectorAll(".input-x").forEach(function (campo) {
    campo.addEventListener("input", function () {
      datos[parseInt(campo.dataset.indice, 10)].x = parseFloat(campo.value) || 0;
    });
  });

  cuerpoTablaDatos.querySelectorAll(".input-y").forEach(function (campo) {
    campo.addEventListener("input", function () {
      datos[parseInt(campo.dataset.indice, 10)].y = parseFloat(campo.value) || 0;
    });
  });

  cuerpoTablaDatos.querySelectorAll(".boton-eliminar-fila").forEach(function (boton) {
    boton.addEventListener("click", function () {
      const indice = parseInt(boton.dataset.indice, 10);
      if (datos.length > 2) {
        datos.splice(indice, 1);
        renderizarTablaDatos();
      } else {
        alert("Se necesitan al menos 2 datos para calcular el modelo.");
      }
    });
  });
}

botonAgregarFila.addEventListener("click", function () {
  datos.push({ x: 0, y: 0 });
  renderizarTablaDatos();
});

function calcularEstadisticas(valores) {
  const n = valores.length;
  const media = valores.reduce(function (suma, v) { return suma + v; }, 0) / n;
  const sumaCuadrados = valores.reduce(function (suma, v) { return suma + (v - media) * (v - media); }, 0);
  const varianza = sumaCuadrados / n;
  const desviacion = Math.sqrt(varianza);
  return { media: media, varianza: varianza, desviacion: desviacion };
}

function calcularModelo(filas) {
  const n = filas.length;
  const xs = filas.map(function (f) { return f.x; });
  const ys = filas.map(function (f) { return f.y; });

  const sumaX = xs.reduce(function (a, b) { return a + b; }, 0);
  const sumaY = ys.reduce(function (a, b) { return a + b; }, 0);
  const sumaX2 = xs.reduce(function (a, b) { return a + b * b; }, 0);
  const sumaXY = filas.reduce(function (a, f) { return a + f.x * f.y; }, 0);

  const mediaX = sumaX / n;
  const mediaY = sumaY / n;

  const Sxx = sumaX2 - n * mediaX * mediaX;
  const Sxy = sumaXY - n * mediaX * mediaY;

  const b1 = Sxy / Sxx;
  const b0 = mediaY - b1 * mediaX;

  const predicciones = xs.map(function (x) { return b0 + b1 * x; });
  const residuales = ys.map(function (y, i) { return y - predicciones[i]; });

  const sse = residuales.reduce(function (suma, e) { return suma + e * e; }, 0);
  const sst = ys.reduce(function (suma, y) { return suma + (y - mediaY) * (y - mediaY); }, 0);

  const mse = sse / n;
  const rmse = Math.sqrt(mse);
  const mae = residuales.reduce(function (suma, e) { return suma + Math.abs(e); }, 0) / n;
  const errorPorcentual = ys.map(function (y, i) { return y === 0 ? 0 : Math.abs(residuales[i] / y); });
  const mape = 100 * errorPorcentual.reduce(function (a, b) { return a + b; }, 0) / n;
  const r2 = sst === 0 ? 0 : 1 - sse / sst;

  return {
    n: n, xs: xs, ys: ys,
    sumaX: sumaX, sumaY: sumaY, sumaX2: sumaX2, sumaXY: sumaXY,
    mediaX: mediaX, mediaY: mediaY, Sxx: Sxx, Sxy: Sxy,
    b0: b0, b1: b1,
    predicciones: predicciones, residuales: residuales,
    errorPorcentual: errorPorcentual,
    sse: sse, sst: sst, mse: mse, rmse: rmse, mae: mae, mape: mape, r2: r2,
    estadisticasX: calcularEstadisticas(xs),
    estadisticasY: calcularEstadisticas(ys)
  };
}

function numero(valor, decimales) {
  return Number(valor).toFixed(decimales === undefined ? 4 : decimales);
}

function actualizarKpis(modelo) {
  document.getElementById("kpi-n").textContent = modelo.n;
  document.getElementById("kpi-modelo").textContent = "y = " + numero(modelo.b0, 2) + " + " + numero(modelo.b1, 2) + "x";
  document.getElementById("kpi-r2").textContent = numero(modelo.r2, 4);
  document.getElementById("kpi-rmse").textContent = numero(modelo.rmse, 4);
  document.getElementById("kpi-mae").textContent = numero(modelo.mae, 4);
  document.getElementById("kpi-mape").textContent = numero(modelo.mape, 2) + "%";

  document.getElementById("est-x-media").textContent = numero(modelo.estadisticasX.media, 4);
  document.getElementById("est-x-de").textContent = numero(modelo.estadisticasX.desviacion, 4);
  document.getElementById("est-x-var").textContent = numero(modelo.estadisticasX.varianza, 4);

  document.getElementById("est-y-media").textContent = numero(modelo.estadisticasY.media, 4);
  document.getElementById("est-y-de").textContent = numero(modelo.estadisticasY.desviacion, 4);
  document.getElementById("est-y-var").textContent = numero(modelo.estadisticasY.varianza, 4);
}

function dibujarGraficaModelo(modelo, puntoPrediccion) {
  const xMin = Math.min.apply(null, modelo.xs);
  const xMax = Math.max.apply(null, modelo.xs);

  const puntosDatos = modelo.xs.map(function (x, i) { return { x: x, y: modelo.ys[i] }; });
  const puntosLinea = [
    { x: xMin, y: modelo.b0 + modelo.b1 * xMin },
    { x: xMax, y: modelo.b0 + modelo.b1 * xMax }
  ];

  const datasets = [
    {
      label: "Datos",
      data: puntosDatos,
      showLine: false,
      backgroundColor: "#1f77b4",
      pointRadius: 5
    },
    {
      label: "Linea de tendencia",
      data: puntosLinea,
      showLine: true,
      borderColor: "#000000",
      borderWidth: 2,
      pointRadius: 0,
      fill: false
    }
  ];

  if (puntoPrediccion) {
    datasets.push({
      label: "Prediccion",
      data: [puntoPrediccion],
      showLine: false,
      backgroundColor: "#d62728",
      pointRadius: 8,
      pointStyle: "triangle"
    });
  }

  if (graficaModelo) {
    graficaModelo.destroy();
  }

  graficaModelo = new Chart(document.getElementById("grafica-modelo"), {
    type: "line",
    data: { datasets: datasets },
    options: {
      scales: {
        x: { type: "linear", title: { display: true, text: "x" } },
        y: { title: { display: true, text: "y" } }
      }
    }
  });
}

function dibujarGraficaVariable(elementoCanvas, graficaAnterior, valores, etiqueta, color) {
  if (graficaAnterior) {
    graficaAnterior.destroy();
  }

  return new Chart(elementoCanvas, {
    type: "bar",
    data: {
      labels: valores.map(function (v, i) { return "#" + (i + 1); }),
      datasets: [{ label: etiqueta, data: valores, backgroundColor: color }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

function generarProcedimiento(modelo) {
  let filasSumas =
    "<p>n = " + modelo.n + "</p>" +
    "<p>&Sigma;x = " + numero(modelo.sumaX, 4) + ", &Sigma;y = " + numero(modelo.sumaY, 4) + "</p>" +
    "<p>&Sigma;x&sup2; = " + numero(modelo.sumaX2, 4) + ", &Sigma;xy = " + numero(modelo.sumaXY, 4) + "</p>" +
    "<p>x&#772; = &Sigma;x / n = " + numero(modelo.mediaX, 4) + "</p>" +
    "<p>y&#772; = &Sigma;y / n = " + numero(modelo.mediaY, 4) + "</p>";

  let bloqueSumas =
    "<div class='bloque-procedimiento'>" +
    "<h3>Paso 1. Sumas y medias</h3>" +
    filasSumas +
    "</div>";

  let bloqueDesviaciones =
    "<div class='bloque-procedimiento'>" +
    "<h3>Paso 2. Sumas de desviaciones</h3>" +
    "<span class='formula-procedimiento'>Sxx = &Sigma;x&sup2; - n*x&#772;&sup2; = " + numero(modelo.sumaX2, 4) + " - " + modelo.n + "*" + numero(modelo.mediaX, 4) + "&sup2; = " + numero(modelo.Sxx, 4) + "</span>" +
    "<span class='formula-procedimiento'>Sxy = &Sigma;xy - n*x&#772;*y&#772; = " + numero(modelo.sumaXY, 4) + " - " + modelo.n + "*" + numero(modelo.mediaX, 4) + "*" + numero(modelo.mediaY, 4) + " = " + numero(modelo.Sxy, 4) + "</span>" +
    "</div>";

  let bloqueCoeficientes =
    "<div class='bloque-procedimiento'>" +
    "<h3>Paso 3. Pendiente e interseccion</h3>" +
    "<span class='formula-procedimiento'>b1 = Sxy / Sxx = " + numero(modelo.Sxy, 4) + " / " + numero(modelo.Sxx, 4) + " = " + numero(modelo.b1, 4) + "</span>" +
    "<span class='formula-procedimiento'>b0 = y&#772; - b1*x&#772; = " + numero(modelo.mediaY, 4) + " - " + numero(modelo.b1, 4) + "*" + numero(modelo.mediaX, 4) + " = " + numero(modelo.b0, 4) + "</span>" +
    "<span class='formula-procedimiento'>Modelo: y&#770; = " + numero(modelo.b0, 4) + " + " + numero(modelo.b1, 4) + "x</span>" +
    "</div>";

  let filasResiduales = "";
  modelo.xs.forEach(function (x, i) {
    filasResiduales +=
      "<tr>" +
      "<td>" + x + "</td>" +
      "<td>" + modelo.ys[i] + "</td>" +
      "<td>" + numero(modelo.predicciones[i], 4) + "</td>" +
      "<td>" + numero(modelo.residuales[i], 4) + "</td>" +
      "<td>" + numero(Math.abs(modelo.residuales[i]), 4) + "</td>" +
      "<td>" + numero(modelo.residuales[i] * modelo.residuales[i], 4) + "</td>" +
      "<td>" + numero(modelo.errorPorcentual[i], 4) + "</td>" +
      "</tr>";
  });

  let bloqueResiduales =
    "<div class='bloque-procedimiento'>" +
    "<h3>Paso 4. Predicciones y residuales</h3>" +
    "<div class='tabla-contenedor'><table><thead><tr>" +
    "<th>x</th><th>y</th><th>y&#770;</th><th>e</th><th>|e|</th><th>e&sup2;</th><th>|e|/y</th>" +
    "</tr></thead><tbody>" + filasResiduales + "</tbody></table></div>" +
    "<span class='formula-procedimiento'>&Sigma;e&sup2; = SSE = " + numero(modelo.sse, 4) + "</span>" +
    "</div>";

  let bloqueMetricas =
    "<div class='bloque-procedimiento'>" +
    "<h3>Paso 5. Metricas de evaluacion</h3>" +
    "<span class='formula-procedimiento'>MSE = SSE / n = " + numero(modelo.sse, 4) + " / " + modelo.n + " = " + numero(modelo.mse, 4) + "</span>" +
    "<span class='formula-procedimiento'>RMSE = raiz(MSE) = " + numero(modelo.rmse, 4) + "</span>" +
    "<span class='formula-procedimiento'>MAE = &Sigma;|e| / n = " + numero(modelo.mae, 4) + "</span>" +
    "<span class='formula-procedimiento'>MAPE = (100/n) * &Sigma;(|e|/y) = " + numero(modelo.mape, 4) + "%</span>" +
    "<span class='formula-procedimiento'>SST = &Sigma;(y - y&#772;)&sup2; = " + numero(modelo.sst, 4) + "</span>" +
    "<span class='formula-procedimiento'>R&sup2; = 1 - SSE/SST = " + numero(modelo.r2, 4) + "</span>" +
    "</div>";

  contenedorProcedimiento.innerHTML = bloqueSumas + bloqueDesviaciones + bloqueCoeficientes + bloqueResiduales + bloqueMetricas;
}

function calcular() {
  if (datos.length < 2) {
    alert("Se necesitan al menos 2 datos para calcular el modelo.");
    return;
  }

  modeloActual = calcularModelo(datos);

  actualizarKpis(modeloActual);
  dibujarGraficaModelo(modeloActual, null);
  graficaX = dibujarGraficaVariable(document.getElementById("grafica-x"), graficaX, modeloActual.xs, "x", "#1f77b4");
  graficaY = dibujarGraficaVariable(document.getElementById("grafica-y"), graficaY, modeloActual.ys, "y", "#2ca02c");
  generarProcedimiento(modeloActual);

  resultadoPrediccion.textContent = "";
}

botonCalcular.addEventListener("click", calcular);

botonPredecir.addEventListener("click", function () {
  if (!modeloActual) {
    alert("Primero presiona 'Calcular modelo'.");
    return;
  }

  const xPrediccion = parseFloat(inputXPrediccion.value);

  if (isNaN(xPrediccion)) {
    alert("Escribe un valor de x valido.");
    return;
  }

  const yPrediccion = modeloActual.b0 + modeloActual.b1 * xPrediccion;

  resultadoPrediccion.textContent =
    "Para x = " + xPrediccion + ": y = " + numero(modeloActual.b0, 4) + " + " + numero(modeloActual.b1, 4) + " * " + xPrediccion + " = " + numero(yPrediccion, 4);

  dibujarGraficaModelo(modeloActual, { x: xPrediccion, y: yPrediccion });
});

renderizarTablaDatos();
calcular();
