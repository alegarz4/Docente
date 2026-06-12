const PROMEDIOS_OFICIALES_KEY = "promediosPreviosPRO";
let promediosOficiales = JSON.parse(localStorage.getItem(PROMEDIOS_OFICIALES_KEY) || "{}");
const PERIODOS_PROMEDIOS = ["Periodo 1","Periodo 2","Periodo 3"];

function promedioOficial(id, periodo){
  const datos = promediosOficiales[id] || {};
  const anterior = periodo === "Periodo 1" ? datos.periodo1 : periodo === "Periodo 2" ? datos.periodo2 : undefined;
  const valor = datos[periodo] ?? anterior;
  return valor === undefined ? null : Number(valor);
}

function instalarPestanaPromedios(){
  if(document.getElementById("promedios")) return;
  const botonReportes = document.querySelector('button[onclick="cambiarTab(\'reportes\')"]');
  const boton = document.createElement("button");
  boton.textContent = "Promedios";
  boton.onclick = ()=>cambiarTab("promedios");
  botonReportes?.parentNode.insertBefore(boton, botonReportes);
  const reportes = document.getElementById("reportes");
  const seccion = document.createElement("div");
  seccion.id = "promedios";
  seccion.className = "hidden";
  seccion.innerHTML = `<div class="card"><h3>Promedios por periodo</h3><p class="muted">El promedio calculado se obtiene de las actividades. Puedes modificar el promedio oficial para considerar trabajos extra; ese valor se usará en reportes y en el promedio final.</p><div class="grid"><div><label>Grupo</label><select id="grupoPromedios"></select></div><div><label>Periodo</label><select id="periodoPromedios"></select></div></div><button onclick="cargarPromediosApp()">Cargar alumnos</button><div id="tablaPromedios"></div><button onclick="guardarPromediosApp()">Guardar modificaciones</button></div>`;
  reportes.parentNode.insertBefore(seccion, reportes);
  const grupos = document.getElementById("grupoPromedios");
  gruposUnicos().forEach(grupo=>grupos.add(new Option(grupo, grupo)));
  grupos.addEventListener("change", cargarPromediosApp);
  const periodos = document.getElementById("periodoPromedios");
  PERIODOS_PROMEDIOS.forEach(periodo=>periodos.add(new Option(periodo, periodo)));
  periodos.addEventListener("change", cargarPromediosApp);
  cargarPromediosApp();
}

window.cargarPromediosApp = function(){
  const grupo = document.getElementById("grupoPromedios")?.value;
  const periodo = document.getElementById("periodoPromedios")?.value;
  const cont = document.getElementById("tablaPromedios");
  if(!cont) return;
  cont.innerHTML = '<table><thead><tr><th>Alumno</th><th>Promedio calculado</th><th>Promedio oficial editable</th></tr></thead><tbody></tbody></table>';
  const tbody = cont.querySelector("tbody");
  alumnos.filter(a=>a.grupo===grupo).forEach(a=>{
    const calculado = resumenEvaluacionOriginal(a.id, periodo).total;
    const oficial = promedioOficial(a.id, periodo);
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${a.nombre}</td><td>${Math.round(calculado)}</td>`;
    const td = document.createElement("td");
    const input = document.createElement("input");
    Object.assign(input,{type:"number",min:"5",max:"10",step:"1",className:"campoChico promedioOficialApp",placeholder:String(Math.round(calculado)),value:oficial === null ? "" : String(oficial)});
    input.dataset.alumnoId = a.id;
    input.dataset.periodo = periodo;
    td.appendChild(input); tr.appendChild(td); tbody.appendChild(tr);
  });
};

window.guardarPromediosApp = function(){
  const campos = document.querySelectorAll(".promedioOficialApp");
  if([...campos].some(c=>c.value && (!Number.isInteger(Number(c.value)) || Number(c.value)<5 || Number(c.value)>10))){ mostrarMensaje("Los promedios deben ser enteros entre 5 y 10"); return; }
  campos.forEach(campo=>{
    const id=campo.dataset.alumnoId, periodo=campo.dataset.periodo;
    if(!promediosOficiales[id]) promediosOficiales[id]={};
    if(campo.value) promediosOficiales[id][periodo]=Number(campo.value); else delete promediosOficiales[id][periodo];
    if(periodo==="Periodo 1") delete promediosOficiales[id].periodo1;
    if(periodo==="Periodo 2") delete promediosOficiales[id].periodo2;
  });
  localStorage.setItem(PROMEDIOS_OFICIALES_KEY,JSON.stringify(promediosOficiales)); cargarPromediosApp(); mostrarMensaje("Promedios oficiales guardados");
};

const resumenEvaluacionOriginal = window.resumenEvaluacion;
window.resumenEvaluacion = function(id, periodo=""){
  if(periodo){ const calculado=resumenEvaluacionOriginal(id,periodo), oficial=promedioOficial(id,periodo); return {...calculado,total:oficial===null?calculado.total:oficial}; }
  const evaluaciones=PERIODOS_PROMEDIOS.map(p=>window.resumenEvaluacion(id,p)), actual=evaluaciones[2];
  return {...actual,total:evaluaciones.reduce((s,e)=>s+e.total,0)/evaluaciones.length};
};

const cambiarTabOriginal=window.cambiarTab;
window.cambiarTab=function(tab){ if(tab==="promedios"){ ["alumnos","asistencia","actividades","conducta","reportes","configuracion","promedios"].forEach(id=>document.getElementById(id)?.classList.add("hidden")); document.getElementById("promedios")?.classList.remove("hidden"); cargarPromediosApp(); return; } document.getElementById("promedios")?.classList.add("hidden"); cambiarTabOriginal(tab); };

const generarResumenGrupalOriginal=window.generarResumenGrupal;
window.generarResumenGrupal=function(){
  generarResumenGrupalOriginal();
  if(document.getElementById("periodoResumen")?.value) return;
  const grupo=document.getElementById("grupoResumen")?.value;
  const lista=alumnos.filter(a=>a.grupo===grupo);
  document.querySelectorAll("#tablaResumenGrupal tbody tr").forEach((tr,i)=>{ const td=tr.lastElementChild; if(td&&lista[i]) td.textContent=window.resumenEvaluacion(lista[i].id,"").total.toFixed(1); });
  const promedio=lista.length?lista.reduce((s,a)=>s+window.resumenEvaluacion(a.id,"").total,0)/lista.length:0;
  const fuerte=document.querySelector("#promediosGrupo strong"); if(fuerte) fuerte.textContent=promedio.toFixed(1);
  const pie=document.querySelector("#tablaResumenGrupal tfoot tr")?.lastElementChild; if(pie) pie.textContent=promedio.toFixed(1);
};

const generarReporteOriginal=window.generarReporte;
window.generarReporte=function(){
  generarReporteOriginal();
  if(document.getElementById("periodoReporte")?.value) return;
  const id=document.getElementById("alumnoReporte")?.value;
  const pre=document.getElementById("resultadoReporte");
  if(id&&pre) pre.textContent=pre.textContent.replace(/TOTAL:.*$/,`TOTAL: ${window.resumenEvaluacion(id,"").total.toFixed(1)}`m);
};

if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",instalarPestanaPromedios); else instalarPestanaPromedios();
