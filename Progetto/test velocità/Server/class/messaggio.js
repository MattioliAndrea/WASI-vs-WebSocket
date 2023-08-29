//classe messaggio
module.exports = class Messaggio{
    constructor(mittente, destinatario, testo) {
        this.mittente=mittente;
        this.destinatario=destinatario;
        this.testo=testo;
    }
};