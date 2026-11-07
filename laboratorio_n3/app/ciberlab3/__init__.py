"""CiberLab N3 — laboratorio avanzado: AD, DFIR, malware, cloud/K8s, red/purple team y auditoría formal."""
import os
from pathlib import Path

PORT = int(os.environ.get("CIBERLAB3_PORT", "8768"))
DATA = Path(os.environ.get("XDG_DATA_HOME", Path.home() / ".local/share")) / "ciberlab3"
WORKSPACE = Path(os.environ.get("CIBERLAB3_HOME", Path.home() / "CiberLab3"))
STATIC = Path(__file__).resolve().parent / "static"
