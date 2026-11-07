#!/usr/bin/env python3
"""N2·01 — Interpretar un escaneo nmap y priorizar riesgos.
Genera datos/escaneo.xml (formato real de nmap -oX) y datos/escaneo.nmap (salida normal) de una red de oficina."""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[2] / "_comun"))
from lab import Lab  # noqa: E402

lab = Lab(__file__, "N2·01 · Interpretar un escaneo nmap y priorizar", 201)
r = lab.rng
red = "192.168.56"

PERFILES = {
    "web": [(22, "ssh", "OpenSSH", "8.9p1 Ubuntu"), (80, "http", "nginx", "1.24.0"), (443, "https", "nginx", "1.24.0")],
    "ficheros": [(139, "netbios-ssn", "Samba smbd", "4.6.2"), (445, "microsoft-ds", "Samba smbd", "4.6.2")],
    "bd": [(22, "ssh", "OpenSSH", "9.6p1"), (3306, "mysql", "MySQL", "8.0.36")],
    "impresora": [(9100, "jetdirect", "", ""), (80, "http", "HP LaserJet http config", "")],
    "legado": [(21, "ftp", "vsftpd", "2.3.4"), (23, "telnet", "Linux telnetd", ""), (22, "ssh", "OpenSSH", "4.7p1 Debian")],
    "dc": [(53, "domain", "Simple DNS Plus", ""), (88, "kerberos-sec", "Microsoft Windows Kerberos", ""),
           (389, "ldap", "Microsoft Windows Active Directory LDAP", ""), (445, "microsoft-ds", "", ""), (3389, "ms-wbt-server", "Microsoft Terminal Services", "")],
    "camara": [(554, "rtsp", "", ""), (80, "http", "Boa HTTPd", "0.94.13")],
}
nombres = list(PERFILES)
r.shuffle(nombres)
hosts = {}
usadas = set()
for p in nombres:
    while True:
        ip = f"{red}.{r.randint(10, 200)}"
        if ip not in usadas:
            usadas.add(ip)
            break
    hosts[ip] = p
orden = sorted(hosts, key=lambda x: int(x.split(".")[-1]))

xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<nmaprun scanner="nmap" args="nmap -sV -T4 -oX escaneo.xml 192.168.56.0/24" version="7.95">']
txt = ["# Nmap 7.95 scan initiated as: nmap -sV -T4 -oN escaneo.nmap 192.168.56.0/24"]
for ip in orden:
    perfil = hosts[ip]
    puertos = sorted(PERFILES[perfil])
    xml.append(f' <host><status state="up"/><address addr="{ip}" addrtype="ipv4"/><hostnames><hostname name="{perfil}.oficina.lan"/></hostnames><ports>')
    txt += [f"Nmap scan report for {perfil}.oficina.lan ({ip})", "Host is up (0.00030s latency).", "PORT     STATE SERVICE      VERSION"]
    for port, srv, prod, ver in puertos:
        xml.append(f'  <port protocol="tcp" portid="{port}"><state state="open"/><service name="{srv}" product="{prod}" version="{ver}"/></port>')
        txt.append(f"{str(port) + '/tcp':<9}open  {srv:<12} {prod} {ver}".rstrip())
    xml.append(" </ports></host>")
    txt.append("")
xml.append(f'<runstats><hosts up="{len(orden)}" down="{254 - len(orden)}" total="254"/></runstats></nmaprun>')
txt.append(f"# Nmap done: 254 IP addresses ({len(orden)} hosts up)")
lab.escribir("escaneo.xml", "\n".join(xml) + "\n")
lab.escribir("escaneo.nmap", "\n".join(txt) + "\n")

ip = {v: k for k, v in hosts.items()}
total_abiertos = sum(len(v) for v in PERFILES.values())
lab.pregunta("¿Cuántos equipos están encendidos?", len(orden), pista="grep -c 'Nmap scan report' escaneo.nmap")
lab.pregunta("¿Cuántos puertos abiertos hay en total?", total_abiertos, pista="grep -c '/tcp *open' escaneo.nmap")
lab.pregunta("¿Qué IP tiene vsftpd 2.3.4 (versión con puerta trasera conocida, CVE-2011-2523)?", ip["legado"], pista="grep -B10 'vsftpd 2.3.4' escaneo.nmap")
lab.pregunta("Esa misma máquina tiene un servicio que envía las contraseñas en claro además de FTP. ¿Cuál? (nombre del servicio)", "telnet")
lab.pregunta("¿Qué IP parece un controlador de dominio de Active Directory?", ip["dc"], pista="Kerberos (88) + LDAP (389) = controlador de dominio.")
lab.pregunta("¿Qué IP tiene Samba 4.6.2 (vulnerable a SambaCry, CVE-2017-7494)?", ip["ficheros"])
lab.pregunta("¿Qué base de datos está expuesta a toda la red? (IP)", ip["bd"], pista="Busca el puerto 3306.")
lab.pregunta("Con jq o xmllint no: usa Python o grep. ¿Cuántos hosts tienen SSH (22/tcp)?", sum(1 for v in PERFILES.values() if any(p[0] == 22 for p in v)),
             pista="grep -c '^22/tcp' escaneo.nmap")
lab.pregunta("Prioriza: ¿qué IP atacarías (o parchearías) PRIMERO? ", ip["legado"],
             pista="Exploit público trivial + contraseñas en claro + SSH de 2008: es la fruta madura.")
lab.terminar()
