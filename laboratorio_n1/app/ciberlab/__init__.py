"""CiberLab — entorno de aprendizaje, práctica y auditoría de ciberseguridad."""
import os
from pathlib import Path

PORT = int(os.environ.get("CIBERLAB_PORT", "8766"))
DATA = Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local/share")) / "ciberlab"
WORKSPACE = Path(os.environ.get("CIBERLAB_HOME", Path.home() / "CiberLab"))
STATIC = Path(__file__).resolve().parent / "static"
