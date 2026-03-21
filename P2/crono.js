// Para gestionar el tiempo

let tiempo = 0;
let intervalo = null;


// formateamos el tiempo a 00:00:00
function formatearTiempo(segundos){
    let h = Math.floor(segundos / 3600);
    let m = Math.floor((segundos % 3600) / 60);
    let s = segundos % 60;

    return `${h}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;

}

// iniciamos el cronómetro
function iniciarCrono(){

    if(intervalo !== null) return;  //evitamos duplicados

    intervalo = setInterval( () => {
        tiempo++;
        document.getElementById("tiempo").textContent = formatearTiempo(tiempo);
    }, 1000);
}

// parar cronómetro
function pararCrono(){
    clearInterval(intervalo);
    intervalo = null;
}

//resetear cronómetro
function resetCrono(){
    pararCrono();
    tiempo = 0;
    document.getElementById("tiempo").textContent = "00:00:00";
}