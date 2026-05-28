# Nutri GC

Sistema web local para una clínica de nutrición con:

- acceso por sesión sin base de datos de usuarios
- preregistro antropométrico de pacientes sin duplicar datos
- cálculo automático de IMC y diagnóstico
- historial clínico cronológico con actualización automática sin recargar la página

## Requisitos

- Python 3.10 o superior

## Instalación

```bash
pip install -r requirements.txt
```

## Ejecución

```bash
python app.py
```

Abre luego `http://127.0.0.1:5000`.

## Notas

- El acceso se controla por sesión. Si alguien intenta entrar directo a `/dashboard`, el sistema lo regresa al login.
- Los pacientes se guardan en SQLite local en `nutri.db`.
- El historial se refresca automáticamente con JavaScript consultando la API local.
