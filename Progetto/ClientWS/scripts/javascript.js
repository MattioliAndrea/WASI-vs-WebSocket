function myFunction() { 

    var name = document.getElementById("mittente").value;        
    if (name != undefined && name != null && name.trim()!="") {
        document.cookie = "mittente="+name+"; expires=Thu, 25 Dec 2023 12:00:00 UTC; path=/";
        urlBase = location.href.substring(0, location.href.lastIndexOf("/")+1)
        window.location=urlBase +'/chat.htm?username=' + name;
    }else
    {
        alert('nome utente vuoto');
    }
}