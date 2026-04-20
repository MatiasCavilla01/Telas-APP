from django.db import models

class StoreConfiguration(models.Model):
    title = models.CharField(max_length=100, default="Bienvenido a Telas-APP")
    main_image = models.ImageField(upload_to='banners/', verbose_name="Imagen Principal")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.title