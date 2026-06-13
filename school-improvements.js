const HISTORIAL_PROMEDIOS_KEY="historialPromediosPRO";
let historialMejoras=JSON.parse(localStorage.getItem(HISTORIAL_PROMEDIOS_KEY)||"[]");

function instalarMejorasEscolares(){
  const seccion=document.getElementById("promedios");
  if(seccion&&!document.getElementById("historialPromediosApp")){
    const card=document.createElement("div");card.className="card";card.innerHTML='<h3>Historial de modificaciones</h3><div id="historialPromediosApp"></div>';seccion.appendChild(card);mostrarHistorialMejoras();
  }
  const botonPDF=[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="Exportar PDF");
  if(botonPDF&&![...document.querySelectorAll("button")].some(b=>b.textContent.trim()==="Boleta de tres periodos")){const b=document.createElement("button");b.textContent="Boleta de tres periodos";b.onclick=generarBoletaApp;botonPDF.parentNode.insertBefore(b,botonPDF.nextSibling);}
}

function mostrarHistorialMejoras(){const c=document.getElementById("historialPromediosApp");if(!c)return;if(!historialMejoras.length){c.innerHTML='<p class="muted">Todavía no hay modificaciones registradas.</p>';return;}c.innerHTML='<table><thead><tr><th>Fecha</th><th>Alumno</th><th>Periodo</th><th>Anterior</th><th>Nuevo</th><th>Motivo</th></tr></thead><tbody></tbody></table>';const t=c.querySelector("tbody");historialMejoras.slice(0,100).forEach(r=>{const a=alumnos.find(x=>x.id===r.alumnoId),tr=document.createElement("tr");[r.fecha,a?.nombre||"Alumno eliminado",r.periodo,r.anterior??"Automático",r.nuevo??"Automático",r.motivo].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td);});t.appendChild(tr);});}

const guardarPromediosBase=window.guardarPromediosApp;
window.guardarPromediosApp=function(){document.querySelectorAll(".promedioOficialApp").forEach(c=>{const id=c.dataset.alumnoId,p=c.dataset.periodo,anterior=promedioOficial(id,p),nuevo=c.value?Number(c.value):null;if(anterior!==nuevo){historialMejoras.unshift({fecha:new Date().toLocaleString("es-MX"),alumnoId:id,periodo:p,anterior,nuevo,motivo:nuevo===null?"Restaurado al cálculo automático":"Trabajo extra o modificación manual"});}});guardarPromediosBase();localStorage.setItem(HISTORIAL_PROMEDIOS_KEY,JSON.stringify(historialMejoras));mostrarHistorialMejoras();};

function generarBoletaApp(){if(!window.jspdf){mostrarMensaje("No se pudo cargar PDF");return;}const select=document.getElementById("alumnoReporte"),alumno=alumnos.find(a=>a.id===select?.value);if(!alumno){mostrarMensaje("Selecciona un alumno");return;}const{jsPDF}=window.jspdf,doc=new jsPDF(),periodos=["Periodo 1","Periodo 2","Periodo 3"],evals=periodos.map(p=>window.resumenEvaluacion(alumno.id,p)),final=window.resumenEvaluacion(alumno.id,"").total;doc.setFontSize(18);doc.text(configuracion.nombreEscuela||"Escuela",20,20);doc.setFontSize(16);doc.text("Boleta de tres periodos",20,45);doc.setFontSize(12);doc.text(`Alumno: ${alumno.nombre}`,20,65);doc.text(`Grupo: ${alumno.grupo}`,20,75);periodos.forEach((p,i)=>doc.text(`${p}: ${Math.round(evals[i].total)}`,30,100+i*18));doc.setFontSize(15);doc.text(`PROMEDIO FINAL: ${final.toFixed(1)}`,30,165);doc.save(`Boleta_${alumno.nombre.replace(/[\\/:*?"<>|]/g,"_")}.pdf`);}

if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",instalarMejorasEscolares);else instalarMejorasEscolares();
