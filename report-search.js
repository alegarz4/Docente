function prepararBusquedaAlumnoReporte(){
  const select = document.getElementById("alumnoReporte");
  if(!select || document.getElementById("buscarAlumnoReporte")) return;

  const input = document.createElement("input");
  input.id = "buscarAlumnoReporte";
  input.placeholder = "Comienza a escribir el nombre";
  input.setAttribute("list", "listaAlumnosReporte");

  const lista = document.createElement("datalist");
  lista.id = "listaAlumnosReporte";

  const label = select.previousElementSibling;
  if(label) label.textContent = "Escribe el nombre del alumno";

  select.style.display = "none";
  select.parentNode.insertBefore(input, select);
  select.parentNode.insertBefore(lista, select);

  function actualizarSugerencias(){
    lista.innerHTML = "";
    alumnos
      .slice()
      .sort((a,b)=>a.nombre.localeCompare(b.nombre, "es"))
      .forEach(a=>{
        const opcion = document.createElement("option");
        opcion.value = `${a.nombre} - ${a.grupo}`;
        opcion.dataset.alumnoId = a.id;
        lista.appendChild(opcion);
      });
  }

  function seleccionarAlumno(){
    const texto = input.value.trim().toLowerCase();
    const alumno = alumnos.find(a=>`${a.nombre} - ${a.grupo}`.toLowerCase()===texto)
      || alumnos.find(a=>a.nombre.toLowerCase()===texto);
    select.value = alumno ? alumno.id : "";
  }

  input.addEventListener("input", seleccionarAlumno);
  input.addEventListener("change", seleccionarAlumno);
  document.querySelector('button[onclick="cambiarTab(\'reportes\')"]')?.addEventListener("click", actualizarSugerencias);
  actualizarSugerencias();
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", prepararBusquedaAlumnoReporte);
}else{
  prepararBusquedaAlumnoReporte();
}
