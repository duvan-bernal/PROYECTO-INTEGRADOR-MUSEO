package museo.controller;

import io.quarkus.qute.Location;
import io.quarkus.qute.Template;
import io.quarkus.qute.TemplateInstance;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

// Controlador de la pagina de inicio (la "C" de MVC).
// Recibe la peticion del navegador y devuelve la VISTA index.html.
@Path("/")
public class HomeController {

    @Inject
    @Location("index.html")
    Template indexTemplate;

    // GET / -> muestra la pagina principal (index.html)
    @GET
    @Produces(MediaType.TEXT_HTML)
    public TemplateInstance index() {
        return indexTemplate.data("seccion", "inicio");
    }
}

