"""
icc_dinamica.py — Módulo de Simulación Dinámica del Inconsciente (Horn Torus)

Uso estándar solicitado:
    from icc_dinamica import correr_caso, scl90r_a_parametros
    res = correr_caso(tu_scl90r_data, estructura="neurotico")  # -> res["IGS_sim"], res["Q_total"]

Estructuras Psíquicas soportadas:
    - "neurotico"  : Represión primaria operante (S1 -> S2), ligadura significante.
    - "psicotico"  : Forclusión del Nombre del Padre (P0), divergencia en cúspide p (v=pi).
    - "perverso"   : Desmentida (Verleugnung), pantalla fetichista contingente.
    - "borderline" / "fronterizo" : Estructura psíquica Borderline (Spaltung / Escisión yoica bimodal).
"""

import math

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

try:
    from scipy.integrate import odeint
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False

def scl90r_a_parametros(scl90r_data, estructura="neurotico"):
    """
    Convierte el vector SCL-90-R a parámetros cinéticos y topológicos del modelo Horn Torus.
    """
    def g(k, def_val=0.8):
        v = scl90r_data.get(k, def_val)
        return float(v) if v is not None else def_val

    som = g("Somatización", 0.8)
    oc  = g("Obsesión-Compulsión", 0.9)
    si  = g("Sensibilidad Interpersonal", 0.7)
    dep = g("Depresión", 0.85)
    ans = g("Ansiedad", 0.95)
    hos = g("Hostilidad", 0.6)
    fob = g("Ansiedad Fóbica", 0.75)
    par = g("Ideación Paranoide", 0.8)
    psy = g("Psicoticismo", 0.9)
    gsi = g("GSI", 0.85)
    pst = g("PST", 45)
    psdi = g("PSDI", 1.70)

    # Carga inicial pulsional Q0
    Q0 = max(0.1, gsi * 0.95 + (psdi - 1.0) * 0.45)

    # Disipación somática (gamma) y Drang oscilatorio (omega)
    gamma_base = 0.45 + (som * 0.18) + (oc * 0.12)
    omega_base = 1.05 + (ans * 0.40) + (hos * 0.35)
    I_trauma = 0.50 + (dep * 0.28) + (fob * 0.32) + (si * 0.20)
    delta = min(0.85, 0.20 + gsi * 0.25)
    lambda_bar_base = 1.80 + (oc * 0.30) - (gsi * 0.25)
    c0 = 0.35 + gsi * 0.20

    if estructura == "neurotico":
        K_rep = max(0.55, 0.88 - (ans * 0.12))
        lambda_bar = max(1.2, lambda_bar_base)
        gamma = gamma_base * 1.05
        omega = omega_base
    elif estructura == "psicotico":
        K_rep = 0.06
        lambda_bar = 0.65
        gamma = gamma_base * 0.45
        omega = omega_base * 1.35
        c0 = c0 * 1.5
    elif estructura == "perverso":
        K_rep = 0.42
        lambda_bar = 1.45
        gamma = gamma_base * 0.85
        omega = omega_base * 0.90
    else:  # fronterizo
        K_rep = 0.35
        lambda_bar = 1.05
        gamma = gamma_base * 0.70
        omega = omega_base * 1.20

    return {
        "estructura": estructura,
        "Q0": Q0,
        "gamma": gamma,
        "omega": omega,
        "K_rep": K_rep,
        "I_trauma": I_trauma,
        "lambda_bar": lambda_bar,
        "delta": delta,
        "c0": c0,
        "a_critical": math.pi / 4.0
    }

def correr_caso(scl90r_data, estructura="neurotico", t_max=20.0, dt=0.05, guardar_grafica=None):
    """
    Ejecuta la simulación dinámica del caso clínico.
    
    Retorna:
        dict con:
          - "IGS_sim": float (IGS dinámico simulado)
          - "Q_total": float (Carga energética acumulada)
          - "Q_max": float
          - "desborde": bool
          - "tiempo": list
          - "Q_t": list
          - "angustia_t": list
          - "regimen": str
          - "interpretacion_clinica": str
    """
    p = scl90r_a_parametros(scl90r_data, estructura)
    a_cr = p["a_critical"]

    steps = int(round(t_max / dt))
    t_list = [round(i * dt, 4) for i in range(steps)]

    # Estado: [Q, A, u, v]
    y0 = [p["Q0"], max(0.1, p["I_trauma"] * 0.4), 0.0, math.pi / 2.0]

    def sistema(y, t_curr):
        q_curr, a_curr, u_curr, v_curr = y
        drang = p["c0"] + 0.35 * math.sin(p["omega"] * t_curr)
        damping = p["gamma"] * q_curr

        if estructura == "neurotico":
            defensa = p["K_rep"] * math.tanh(q_curr / 1.2)
            ligadura = 0.45 * defensa
            du = math.atan2(math.sin(u_curr - math.pi), math.cos(u_curr - math.pi))
            dv = math.atan2(math.sin(v_curr - 3.0 * math.pi / 4.0), math.cos(v_curr - 3.0 * math.pi / 4.0))
            dist_f = math.hypot(du, dv)
            angustia_src = (a_cr - dist_f) * 1.5 * p["I_trauma"] if dist_f < a_cr else 0.0
        elif estructura == "psicotico":
            defensa = 0.05 * math.sin(q_curr)
            ligadura = 0.02 * q_curr
            dv_cusp = abs(math.atan2(math.sin(v_curr - math.pi), math.cos(v_curr - math.pi)))
            angustia_src = (1.2 / max(0.15, dv_cusp)) * 0.35 * p["I_trauma"]
            damping *= 0.5
        elif estructura == "perverso":
            defensa = p["K_rep"] * (0.8 + 0.2 * math.cos(2 * u_curr))
            ligadura = 0.35 * q_curr
            du = math.atan2(math.sin(u_curr - math.pi), math.cos(u_curr - math.pi))
            dv = math.atan2(math.sin(v_curr - 3.0 * math.pi / 4.0), math.cos(v_curr - 3.0 * math.pi / 4.0))
            dist_f = math.hypot(du, dv)
            angustia_src = 0.3 * (a_cr - dist_f) * p["I_trauma"] if dist_f < a_cr else 0.0
        else:
            defensa = p["K_rep"] * math.copysign(0.5, math.sin(1.5 * t_curr)) + 0.3
            ligadura = 0.20 * q_curr
            angustia_src = p["I_trauma"] * (0.4 + 0.3 * math.sin(u_curr + v_curr))

        dq = drang - damping - ligadura + (a_curr * 0.4)
        da = angustia_src - 0.65 * a_curr + (max(0.0, q_curr - p["lambda_bar"]) * 0.8)
        du_ang = p["omega"] * 0.85 + (q_curr * 0.15)
        dv_ang = (p["omega"] * 0.55) * (1.0 + p["delta"] * math.cos(u_curr))
        return [dq, da, du_ang, dv_ang]

    if HAS_SCIPY and HAS_NUMPY:
        t_arr = np.array(t_list)
        sol = odeint(sistema, y0, t_arr)
        Q_traj = sol[:, 0].tolist()
        A_traj = sol[:, 1].tolist()
    else:
        # Integrador RK4 universal puro en Python estándar
        Q_traj = [0.0] * steps
        A_traj = [0.0] * steps
        y = list(y0)
        for i in range(steps):
            Q_traj[i] = y[0]
            A_traj[i] = y[1]
            t_c = t_list[i]
            k1 = sistema(y, t_c)
            y_k2 = [y[j] + 0.5 * dt * k1[j] for j in range(4)]
            k2 = sistema(y_k2, t_c + 0.5 * dt)
            y_k3 = [y[j] + 0.5 * dt * k2[j] for j in range(4)]
            k3 = sistema(y_k3, t_c + 0.5 * dt)
            y_k4 = [y[j] + dt * k3[j] for j in range(4)]
            k4 = sistema(y_k4, t_c + dt)
            for j in range(4):
                y[j] += (dt / 6.0) * (k1[j] + 2.0 * k2[j] + 2.0 * k3[j] + k4[j])
            if y[0] < 0.01:
                y[0] = 0.01
            if y[1] < 0.0:
                y[1] = 0.0

    q_sum = float(sum(Q_traj) * dt)
    q_mean = float(sum(Q_traj) / steps)
    a_mean = float(sum(A_traj) / steps)
    q_max = float(max(Q_traj))

    desborde_count = sum(1 for q_v, a_v in zip(Q_traj, A_traj) if a_v >= a_cr or q_v > p["lambda_bar"])
    desborde_pct = float((desborde_count / steps) * 100.0)
    desborde = desborde_count > 0
    ruptura = estructura == "psicotico" and (q_max > 3.2 or a_mean > 1.8)

    igs_sim = (q_mean * 0.55) + (a_mean * 0.45) + (desborde_pct / 100.0 * 0.40)
    if ruptura:
        igs_sim = max(igs_sim, 3.30)  # Fuera de baremo (3x corte T=60)

    if estructura == "neurotico":
        axioma = "Axioma 2(a) — Superposición conexa (Represión S1->S2 / Sin dispersión ni eyección)"
        h2_cond = "H2 (Neurosis): Relajación asintótica a atractor acotado (< 3.0), sin ruptura topológica."
        regimen = "Atractor puntual metaestable (Represión lograda)" if desborde_pct < 10 else "Ciclo límite neurótico sintomático"
        interp = "Represión primaria operante (S1 -> S2); la pulsión se metaboliza en síntoma sin dispersión ni eyección."
    elif estructura == "psicotico":
        axioma = "Axioma 2(b) — Trecho disjunto / Forclusión P0 (Corolario II operante: Eyección por p)"
        h2_cond = "H2 (Psicosis): IGS_sim no relaja a asíntota; diverge o mantiene picos fuera de baremo (≥ 3.30, eyección por la voz v=±π)."
        regimen = "Bifurcación divergente / Desencadenamiento psicótico (Corolario II)" if ruptura else "Compensación pre-psicótica"
        interp = "Forclusión del Nombre del Padre (P0); al no haber metáfora paterna, el afecto traumático es eyectado por p (la voz) fuera de baremo."
    elif estructura == "perverso":
        axioma = "Axioma 2(a) modificado — Desmentida (Pantalla fetichista / Sin eyección)"
        h2_cond = "H2 (Perversión): Ciclo periódico sostenido acotado por fetiche sin eyección exterior."
        regimen = "Régimen perverso de pantalla fetichista"
        interp = "Desmentida (Verleugnung); el fetiche desvía la proximidad a la marca de trauma en ciclo estable."
    else:
        axioma = "Axioma 2(a)/2(b) lábil — Escisión yoica (Spaltung / Estatuto Borderline)"
        h2_cond = "H2 (Borderline): Saltos caóticos bimodales sin punto fijo pero sin eyección terminal permanente."
        regimen = "Oscilador caótico bimodal (Estructura psíquica Borderline)"
        interp = "Estructura psíquica borderline (Spaltung) con alternancia afectiva abrupta sin eyección catastrófica."

    res = {
        "IGS_sim": round(float(igs_sim), 3),
        "Q_total": round(q_sum, 3),
        "Q_max": round(q_max, 3),
        "Q_final": round(float(Q_traj[-1]), 3),
        "desborde": desborde,
        "desborde_pct": round(desborde_pct, 1),
        "ruptura_psicotica": ruptura,
        "tiempo": t_list,
        "Q_t": [round(float(v), 4) for v in Q_traj],
        "angustia_t": [round(float(v), 4) for v in A_traj],
        "regimen": regimen,
        "axioma_operante": axioma,
        "condicion_protocolo_h2": h2_cond,
        "interpretacion_clinica": interp,
        "parametros": p,
        "estructura": estructura
    }

    if guardar_grafica:
        try:
            import matplotlib.pyplot as plt
            fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(10, 7), sharex=True)
            ax1.plot(t_list, Q_traj, 'cyan', lw=2, label="Carga pulsional Q(t)")
            ax1.axhline(p["lambda_bar"], color='red', ls='--', alpha=0.7, label=f"Barrera censura ({p['lambda_bar']:.2f})")
            ax1.set_ylabel("Carga Q")
            ax1.set_title(f"Dinámica Icc — Estructura: {estructura.upper()} (IGS_sim={res['IGS_sim']}, Q_total={res['Q_total']})")
            ax1.legend(loc="upper right")
            ax1.grid(True, alpha=0.3)

            ax2.plot(t_list, A_traj, 'magenta', lw=2, label="Angustia A(t)")
            ax2.axhline(a_cr, color='yellow', ls='--', lw=1.5, label=f"Umbral crítico A_cr ({a_cr:.3f})")
            ax2.set_xlabel("Tiempo t")
            ax2.set_ylabel("Angustia A")
            ax2.legend(loc="upper right")
            ax2.grid(True, alpha=0.3)

            plt.tight_layout()
            plt.savefig(guardar_grafica, dpi=150)
            plt.close()
            print(f"[✓] Gráfica guardada en '{guardar_grafica}'")
        except Exception as e:
            print(f"[!] No se pudo guardar la gráfica: {e}")

    return res

if __name__ == '__main__':
    tu_scl90r_data = {
        "Somatización": 0.8,
        "Obsesión-Compulsión": 0.9,
        "Sensibilidad Interpersonal": 0.7,
        "Depresión": 0.85,
        "Ansiedad": 0.95,
        "Hostilidad": 0.6,
        "Ansiedad Fóbica": 0.75,
        "Ideación Paranoide": 0.8,
        "Psicoticismo": 0.9,
        "GSI": 0.85,
        "PST": 45,
        "PSDI": 1.70
    }

    print("=" * 65)
    print("SIMULACIÓN DINÁMICA DEL INCONSCIENTE (HORN TORUS)")
    print("=" * 65)

    for est in ["neurotico", "psicotico", "perverso", "borderline"]:
        res = correr_caso(tu_scl90r_data, estructura=est)
        print(f"\nEstructura Psíquica: {est.upper()}")
        print(f"  • Axioma operante : {res['axioma_operante']}")
        print(f"  • Condición H2    : {res['condicion_protocolo_h2']}")
        print(f"  • res['IGS_sim']  : {res['IGS_sim']}")
        print(f"  • res['Q_total']  : {res['Q_total']}")
        print(f"  • res['Q_max']    : {res['Q_max']}")
        print(f"  • res['regimen']  : {res['regimen']}")
        print(f"  • Desborde        : {res['desborde']} ({res['desborde_pct']}%)")
