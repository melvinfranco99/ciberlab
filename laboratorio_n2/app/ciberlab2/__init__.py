"""CiberLab N2 — laboratorio avanzado: AD, DFIR, malware, cloud/K8s, red/purple team y auditoría formal."""
import os
from pathlib import Path

PORT = int(os.environ.get("CIBERLAB2_PORT", "8767"))
DATA = Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local/share")) / "ciberlab2"
WORKSPACE = Path(os.environ.get("CIBERLAB2_HOME", Path.home() / "CiberLab2"))
STATIC = Path(__file__).resolve().parent / "static"
