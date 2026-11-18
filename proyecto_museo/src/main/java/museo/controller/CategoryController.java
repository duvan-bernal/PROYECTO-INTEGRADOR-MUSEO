package museo.controller;

import java.util.List;

import io.quarkus.qute.Location;
import io.quarkus.qute.Template;
import io.quarkus.qute.TemplateInstance;

import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.FormParam;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;

import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import museo.model.Category;
import museo.repository.CategoryRepository;

@Path("/categorias")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CategoryController {

    @Inject
    CategoryRepository categoryRepository;

    @Inject
    @Location("categorias.html")
    Template listTemplate;

    // ── VISTA HTML (MVC) ──────────────────────────────────────
    @GET
    @Produces(MediaType.TEXT_HTML)
    public TemplateInstance view() {
        List<Category> categories = categoryRepository.listAllSorted();
        return listTemplate
                .data("categories", categories)
                .data("empty", categories.isEmpty())
                .data("seccion", "categorias");
    }

    // ── LISTAR TODAS ──────────────────────────────────────────
    @GET
    public List<Category> listAll() {
        return categoryRepository.listAllSorted();
    }

    // ── BUSCAR POR ID ─────────────────────────────────────────
    @GET
    @Path("/{id}")
    public Response findById(@PathParam("id") Long id) {
        Category category = categoryRepository.findById(id);
        if (category == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("Categoría con id " + id + " no encontrada")
                    .build();
        }
        return Response.ok(category).build();
    }

    // ── CREAR (JSON) ──────────────────────────────────────────
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Transactional
    public Response create(Category category) {
        if (category == null || category.getName() == null || category.getName().isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("El nombre de la categoría es obligatorio")
                    .build();
        }
        category.setName(category.getName().trim());
        if (category.getDescription() != null) {
            category.setDescription(category.getDescription().trim());
        }
        if (categoryRepository.existsByName(category.getName())) {
            return Response.status(Response.Status.CONFLICT)
                    .entity("Ya existe una categoría con el nombre: " + category.getName())
                    .build();
        }
        categoryRepository.persistAndFlush(category);
        return Response.status(Response.Status.CREATED).entity(category).build();
    }

    // ── CREAR (FORMULARIO HTML) ───────────────────────────────
    @POST
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Produces(MediaType.TEXT_HTML)
    @Transactional
    public Response createFromForm(@FormParam("name") String name,
                                   @FormParam("description") String description) {
        if (name == null || name.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("El nombre de la categoría es obligatorio")
                    .build();
        }
        name = name.trim();
        if (categoryRepository.existsByName(name)) {
            return Response.status(Response.Status.CONFLICT)
                    .entity("Ya existe una categoría con el nombre: " + name)
                    .build();
        }
        Category category = new Category(null, name, description != null ? description.trim() : null);
        categoryRepository.persistAndFlush(category);
        return Response.seeOther(java.net.URI.create("/categorias.html")).build();
    }

    // ── ACTUALIZAR ────────────────────────────────────────────
    @PUT
    @Path("/{id}")
    @Transactional
    public Response update(@PathParam("id") Long id, Category datos) {
        Category category = categoryRepository.findById(id);
        if (category == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("Categoría con id " + id + " no encontrada")
                    .build();
        }
        category.setName(datos.getName());
        category.setDescription(datos.getDescription());
        categoryRepository.persistAndFlush(category);
        return Response.ok(category).build();
    }

    // ── ELIMINAR ──────────────────────────────────────────────
    @DELETE
    @Path("/{id}")
    @Transactional
    public Response delete(@PathParam("id") Long id) {
        Category category = categoryRepository.findById(id);
        if (category == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity("Categoría con id " + id + " no encontrada")
                    .build();
        }
        categoryRepository.delete(category);
        return Response.noContent().build();
    }
}
