const PROMEDIOS_PREVIOS_KEY = "promediosPreviosPRO";
const USAR_PROMEDIOS_PREVIOS_KEY = "usarPromediosPreviosPRO";
let promediosPreviosApp = JSON.parse(localStorage.getItem(PROMEDIOS_PREVIOS_KEY) || "{}");

function guardarPromediosPreviosApp(){
  localStorage.setItem(PROMEDIOS_PREVIOS_KEY, JSON.stringify(promediosPreviosApp));
}

function instalarPromediosPrevios(){
  const reportes = document.getElementById("reportes");
  const configuracion = document.getElementById("configuracion");
  if(!reportes || !configuracion || document.getElementById("grupoPromediosPrevios")) return;

  const tarjeta = document.createElement("div");
  tarjeta.className = "card";
  tarjeta.innerHTML = `
    <h3>Promedios de periodos anteriores</h3>
    <p class="muted">Captura el promedio final de los periodos 1 y 2.</p>
    <label>Grupo</label>
    <select id="grupoPromediosPrevios"></select>
    <button onclick="cargarPromediosPreviosApp()">Cargar alumnos</button>
    <div id="tablaPromediosPrevios"></div>
    <button onclick="guardarPromediosPreviosCapturados()">Guardar promedios</button>
  `;
  reportes.appendChild(tarjeta);

  const tarjetasConfig = configuracion.querySelectorAll(".card");
  const ponderacion = tarjetasConfig[1];
  const opcion = document.createElement("label");
  opcion.innerHTML = '<input type="checkbox" id="usarPromediosPreviosApp" style="width:auto"> Tomar en cuenta Periodo 1 y Periodo 2 al calcular el promedio final';
  ponderacion.insertBefore(opcion, ponderacion.lastElementChild);
  const check = document.getElementById("usarPromediosPreviosApp");
  check.checked = localStorage.getItem(USAR_PROMEDIOS_PREVIOS_KEY) === "1";
  check.addEventListener("change", ()=>localStorage.setItem(USAR_PROMEDIOS_PREVIOS_KEY, check.checked ? "1" : "0"));

  const selector = document.getElementById("grupoPromediosPrevios");
  gruposUnicos().forEach(grupo=>selector.add(new Option(grupo, grupo)));
  selector.addEventListener("change", cargarPromediosPreviosApp);
  cargarPromediosPreviosApp();
}

window.cargarPromediosPreviosApp = function(){
  const grupo = document.getElementById("grupoPromediosPrevios")?.value;
  const cont = document.getElementById("tablaPromediosPrevios");
  if(!cont) return;
  const lista = alumnos.filter(a=>a.grupo===grupo);
  cont.innerHTML = '<table><thead><tr><th>Alumno</th><th>Periodo 1</th><th>Periodo 2</th></tr></thead><tbody></tbody></table>';
  const tbody = cont.querySelector("tbody");
  lista.forEach(a=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${a.nombre}</td>`;
    ["periodo1","periodo2"].forEach(periodo=>{
      const td = document.createElement("td");
      const input = document.createElement("input");
      input.type = "number";
      input.min = "5";
      input.max = "10";
      input.step = "1";
      input.className = "campoChico promedioPrevioApp";
      input.dataset.alumnoId = a.id;
      input.dataset.periodo = periodo;
      input.value = promediosPreviosApp[a.id]?.[periodo] ?? "";
      td.appendChild(input);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
};

window.guardarPromediosPreviosCapturados = function(){
  const campos = document.querySelectorAll(".promedioPrevioApp");
  let error = false;
  campos.forEach(campo=>{
    if(!campo.value) return;
    const valor = Number(campo.value);
    if(!Number.isInteger(valor) || valor < 5 || valor > 10) error = true;
  });
  if(error){
    mostrarMensaje("Los promedios deben ser enteros entre 5 y 10");
    return;
  }
  campos.forEach(campo=>{
    const id = campo.dataset.alumnoId;
    const periodo = campo.dataset.periodo;
    if(!promediosPreviosApp[id]) promediosPreviosApp[id] = {};
    if(campo.value) promediosPreviosApp[id][periodo] = Number(campo.value);
    else delete promediosPreviosApp[id][periodo];
  });
  guardarPromediosPreviosApp();
  mostrarMensaje("Promedios anteriores guardados");
};

const resumenEvaluacionOriginal = window.resumenEvaluacion;
window.resumenEvaluacion = function(id, periodo = ""){
  if(periodo || localStorage.getItem(USAR_PROMEDIOS_PREVIOS_KEY) !== "1"){
    return resumenEvaluacionOriginal(id, periodo);
  }
  const actual = resumenEvaluacionOriginal(id, "Periodo 3");
  const previos = promediosPreviosApp[id] || {};
  const valores = [previos.periodo1, previos.periodo2, actual.total].map(Number).filter(Number.isFinite);
  return {...actual, total:valores.reduce((suma, valor)=>suma + valor, 0) / valores.length};
};

if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", instalarPromediosPrevios);
else instalarPromediosPrevios();
