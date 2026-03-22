console.log("Acierta la contraseña")
alert("Acierta la contraseña en el menor tiempo posible")


//-- Elementos de la gui
const gui = {
    display : document.getElementById("display"),
    start : document.getElementById("start"),
    stop : document.getElementById("stop"),
    reset : document.getElementById("reset")
}

console.log("Ejecutando cronómetro...");

//-- Definir un objeto cronometro
const crono = new Cronometro(gui.display);

//-- Configuro las funciones

//-- Arrancamos el cronometro
gui.start.onclick = () => {
    if (empezardenuevo) {
        console.log("Start!!");
        crono.start();
        start();
    }
}

//-- Detener el cronometro
gui.stop.onclick = () => {
    console.log("Stop!");
    crono.stop();
    stop();
}

//-- Reset del cronometro
gui.reset.onclick = () => {
    console.log("Reset!");
    crono.reset();
    reset();
}


//-- Si dos numeros de la contraseña son iguales

function getRandomNumber(){
    return Math.floor(Math.random() * 10);
}

function explosion(){
    puedesJugar = false
    alert("BOOOOM !!!");
    alert("La bomba ha explotado");
    alert("Recarga la página o pulsa Reset para volver a intentarlo");
    stop();
    empezardenuevo = false;
    crono.reset();
}


function ganar(){
    alert("Has ganado!");
    alert("Recarga la página o pulsa Reset para volver a intentarlo");
    crono.stop();
    empezardenuevo = false;
    puedesJugar = false;
}


function start(){
    puedesJugar = true;
    displaycontrasenia();
}


function reset(){
    intentos = 7;
    empezardenuevo = true;
    document.getElementById("intentos").innerText = intentos;
    password = [ getRandomNumber(), getRandomNumber(), getRandomNumber(), getRandomNumber() ];
    guessed = [ false, false, false, false ];
    aciertos = 0;
    contradiccion = false;
    contrasenasdocumento.forEach(elem => elem.innerText = "*");
    displaycontrasenia();
    crono.reset();
    document.body.style.backgroundImage = "url('fireworks.gif')";
    for (let i = 0; i < password.length; i++) {
        contrasenasdocumento[i].style.color = "yellow";
    }
}


function stop(){
    puedesJugar = false;
    crono.stop();
}

function displaycontrasenia(){
    console.log("Para desarrolladores: la contraseña es:");
    password.forEach(num => console.log(num));
}

function checkLenghtContrasenas() {
    const values = contrasenas.map(contrasena => contrasena.innerText);
    const uniqueValues = new Set(values);
    return uniqueValues.size
}

function checkDuplicateContrasenas() {
    const values = contrasenas.map(contrasena => contrasena.innerText);
    const uniqueValues = new Set(values);
    return uniqueValues.size !== values.length;
}

function checkDuplicatedNumberContrasenas() {
    const values = contrasenas.map(contrasena => contrasena.innerText);
    const uniqueValues = new Set(values);
    return Array.from(uniqueValues)[0];
}

let clave1 = document.getElementById("clave1");
let clave2 = document.getElementById("clave2");
let clave3 = document.getElementById("clave3");
let clave4 = document.getElementById("clave4");



document.getElementById("clave1").innerText = getRandomNumber();
document.getElementById("clave2").innerText = getRandomNumber();
document.getElementById("clave3").innerText = getRandomNumber();
document.getElementById("clave4").innerText = getRandomNumber();


let acertada1 = false;
let acertada2 = false;
let acertada3 = false;
let acertada4 = false;
let acertada5 = false;
let acertada6 = false;
let acertada7 = false;
let acertada8 = false;
let acertada9 = false;

let acertada0 = false;

let puedesJugar = false;

let intentosElement = document.getElementById("intentos");
let intentos = intentosElement.innerText;

console.log(intentos);


clave1.style.display = "none";
clave2.style.display = "none";
clave3.style.display = "none";
clave4.style.display = "none";

let contradiccion = false;

const tecla1 = document.getElementById("tecla1");
const tecla2 = document.getElementById("tecla2");
const tecla3 = document.getElementById("tecla3");
const tecla4 = document.getElementById("tecla4");
const tecla5 = document.getElementById("tecla5");
const tecla6 = document.getElementById("tecla6");
const tecla7 = document.getElementById("tecla7");
const tecla8 = document.getElementById("tecla8");
const tecla9 = document.getElementById("tecla9");
const tecla0 = document.getElementById("tecla0");


let aciertos = 0;


const teclas = [tecla0, tecla1, tecla2, tecla3, tecla4, tecla5, tecla6, tecla7, tecla8, tecla9];
const contrasenas = [clave1, clave2, clave3, clave4];
const hasacertado = [acertada0, acertada1, acertada2, acertada3, acertada4, acertada5, acertada6, acertada7, acertada8, acertada9];


teclas.forEach((tecla, index) => {
    tecla.onclick = () => {
        if (puedesJugar == true) {
            console.log(`Pulsaste ${index}`);
                contrasenas.forEach((contrasena) => {
                    if (contrasena.innerText == index.toString()) {
                        contrasena.style.display = "block";
                        if (hasacertado[index] == false) {
                            
                            if (checkDuplicateContrasenas()) {
                                let numeroRepetido = checkDuplicatedNumberContrasenas();
                                let repeticiones = checkLenghtContrasenas() - 1;
                                if (index == numeroRepetido) {
                                    aciertos += repeticiones;
                                } else {
                                    aciertos++;
                                }
                            } else {
                                aciertos++;
                            }
                            console.log(`Acertaste ${index}!!!`);
                            console.log(`Aciertos: ${aciertos}`);
                            
                            if (aciertos == 4) {
                                ganar();
                                contradiccion = true;
                            }
                        }
                        hasacertado[index] = true;
                    } 
                });
                intentos = intentos - 1;
                console.log(`Intentos restantes:  ${intentos}`);
                document.getElementById("intentos").innerText = intentos;
                if (intentos == 0 && contradiccion == false) {
                    explosion();
                }
        }
    };
});
