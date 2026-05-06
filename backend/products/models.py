from django.db import models

class StoreConfiguration(models.Model):
    title = models.CharField(max_length=100, default="Bienvenido a Telas-APP")
    main_image = models.ImageField(upload_to='banners/', verbose_name="Imagen Principal")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title


class Categoria(models.Model):
    nombre = models.CharField(max_length=100, verbose_name="Nombre")
    descripcion = models.TextField(verbose_name="Descripción", blank=True, null=True)
    imagen = models.ImageField(upload_to='categorias/', verbose_name="Imagen", null=True, blank=True )

    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"
        ordering = ['nombre']

    def __str__(self):
        return self.nombre

class Producto(models.Model):
    TALLE_CHOICES = [
        ('S', 'Small'),
        ('M', 'Medium'),
        ('L', 'Large'),
        ('XL', 'Extra Large'),
        ('XXL', 'Double Extra Large'),
    ]

    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.PROTECT,
        related_name='productos',
        verbose_name="Categoría"
    )
    nombre = models.CharField(max_length=200, verbose_name="Nombre")
    precio = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Precio")
    descripcion = models.TextField(verbose_name="Descripción")
    talle = models.CharField(max_length=10, choices=TALLE_CHOICES, verbose_name="Talle")
    # Esta queda como imagen de portada para el catálogo
    imagen = models.ImageField(upload_to='productos/', verbose_name="Imagen Principal", blank=True, null=True)

    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} - Talle {self.talle}"

# --- NUEVO MODELO PARA LA GALERÍA ---
class ProductoImagen(models.Model):
    producto = models.ForeignKey(
        Producto, 
        on_delete=models.CASCADE, 
        related_name='imagenes_galeria' # Este nombre es clave para el serializador
    )
    imagen = models.ImageField(upload_to='productos/galeria/', verbose_name="Imagen de Galería")

    class Meta:
        verbose_name = "Imagen de Producto"
        verbose_name_plural = "Imágenes de Producto"

    def __str__(self):
        return f"Imagen galería de {self.producto.nombre}"