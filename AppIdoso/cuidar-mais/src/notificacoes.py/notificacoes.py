import tkinter as tk
from tkinter import ttk, messagebox
from datetime import datetime, timedelta
from plyer import notification
import threading
import queue
import time
import uuid
import json
import os

ARQUIVO_LEMBRETES = "lembretes.json"
ARQUIVO_HISTORICO = "historico.json"
DIAS_SEMANA = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"]
MINUTOS_SONECA = 10


# ---------------------------------------------------------------
# Gerenciador de notificações (pode ser importado em outro app)
# ---------------------------------------------------------------
class GerenciadorNotificacoes:
    def __init__(self, ao_disparar=None):
        self.lembretes = self._carregar(ARQUIVO_LEMBRETES)
        self.historico = self._carregar(ARQUIVO_HISTORICO)
        self.adiados = []          # lista de (datetime, id_lembrete)
        self.disparados = set()    # evita disparar duas vezes no mesmo minuto
        self.ao_disparar = ao_disparar
        self.trava = threading.RLock()
        self.rodando = False

    # ----- arquivos -----
    def _carregar(self, caminho):
        if os.path.exists(caminho):
            try:
                with open(caminho, "r", encoding="utf-8") as arquivo:
                    return json.load(arquivo)
            except (json.JSONDecodeError, OSError):
                return []
        return []

    def _salvar(self, caminho, dados):
        try:
            with open(caminho, "w", encoding="utf-8") as arquivo:
                json.dump(dados, arquivo, ensure_ascii=False, indent=4)
        except OSError as erro:
            print("Não foi possível salvar o arquivo:", erro)

    # ----- lembretes -----
    def buscar(self, id_lembrete):
        for item in self.lembretes:
            if item["id"] == id_lembrete:
                return item
        return None

    def adicionar(self, tipo, nome, horario, mensagem, dias):
        item = {
            "id": uuid.uuid4().hex,
            "tipo": tipo,
            "nome": nome,
            "horario": horario,
            "mensagem": mensagem,
            "dias": dias,
            "ativo": True
        }
        with self.trava:
            self.lembretes.append(item)
            self._salvar(ARQUIVO_LEMBRETES, self.lembretes)
        return item

    def excluir(self, id_lembrete):
        with self.trava:
            self.lembretes[:] = [
                item for item in self.lembretes
                if item["id"] != id_lembrete
            ]
            self.adiados = [
                par for par in self.adiados if par[1] != id_lembrete
            ]
            self._salvar(ARQUIVO_LEMBRETES, self.lembretes)

    def alternar_ativo(self, id_lembrete):
        with self.trava:
            item = self.buscar(id_lembrete)
            if item:
                item["ativo"] = not item.get("ativo", True)
                self._salvar(ARQUIVO_LEMBRETES, self.lembretes)

    # ----- soneca e histórico -----
    def adiar(self, id_lembrete, minutos=MINUTOS_SONECA):
        with self.trava:
            quando = datetime.now() + timedelta(minutes=minutos)
            self.adiados.append((quando, id_lembrete))

    def registrar_historico(self, item, status="Pendente"):
        entrada = {
            "id": uuid.uuid4().hex,
            "lembrete_id": item["id"],
            "tipo": item["tipo"],
            "nome": item["nome"],
            "data_hora": datetime.now().strftime("%d/%m/%Y %H:%M"),
            "status": status
        }
        self.historico.append(entrada)
        self._salvar(ARQUIVO_HISTORICO, self.historico)
        return entrada

    def atualizar_status(self, id_entrada, status):
        with self.trava:
            for entrada in self.historico:
                if entrada["id"] == id_entrada:
                    entrada["status"] = status
                    break
            self._salvar(ARQUIVO_HISTORICO, self.historico)

    def limpar_historico(self):
        with self.trava:
            self.historico.clear()
            self._salvar(ARQUIVO_HISTORICO, self.historico)

    # ----- notificação do sistema -----
    def enviar_notificacao(self, titulo, mensagem):
        try:
            notification.notify(
                title=titulo,
                message=mensagem,
                app_name="Cuidar+",
                timeout=10
            )
        except Exception as erro:
            print("Não foi possível mostrar a notificação:", erro)

    def _disparar(self, item):
        titulo = f"Hora de {item['tipo'].lower()}: {item['nome']}"
        mensagem = item.get("mensagem", "").strip()

        if not mensagem:
            mensagem = "Confira seu lembrete no Cuidar+."

        self.enviar_notificacao(titulo, mensagem)
        entrada = self.registrar_historico(item)

        if self.ao_disparar:
            self.ao_disparar(item, entrada)

    # ----- verificação em segundo plano -----
    def _verificar(self):
        agora = datetime.now()
        horario_atual = agora.strftime("%H:%M")
        data_atual = agora.strftime("%Y-%m-%d")
        dia_semana = agora.weekday()

        with self.trava:
            for item in list(self.lembretes):
                if not item.get("ativo", True):
                    continue

                if dia_semana not in item.get("dias", list(range(7))):
                    continue

                chave = f"{data_atual}_{item['id']}_{horario_atual}"

                if item["horario"] == horario_atual and chave not in self.disparados:
                    self.disparados.add(chave)
                    self._disparar(item)

            restantes = []
            for quando, id_lembrete in self.adiados:
                if agora >= quando:
                    item = self.buscar(id_lembrete)
                    if item:
                        self._disparar(item)
                else:
                    restantes.append((quando, id_lembrete))
            self.adiados = restantes

    def _loop(self):
        while self.rodando:
            self._verificar()
            time.sleep(10)

    def iniciar(self):
        if not self.rodando:
            self.rodando = True
            threading.Thread(target=self._loop, daemon=True).start()

    def parar(self):
        self.rodando = False


# ---------------------------------------------------------------
# Interface
# ---------------------------------------------------------------
def iniciar_app():
    fila_popups = queue.Queue()

    def ao_disparar(item, entrada):
        # chamado na thread de verificação: só coloca na fila
        fila_popups.put((item, entrada))

    gerenciador = GerenciadorNotificacoes(ao_disparar=ao_disparar)

    janela = tk.Tk()
    janela.title("Cuidar+ | Sistema de Notificações")
    janela.geometry("850x620")
    janela.minsize(750, 500)

    # ----- popup dentro do app -----
    def mostrar_popup(item, entrada):
        popup = tk.Toplevel(janela)
        popup.title("Cuidar+ 🔔")
        popup.geometry("360x190")
        popup.attributes("-topmost", True)
        popup.resizable(False, False)

        ttk.Label(
            popup,
            text=f"Hora de {item['tipo'].lower()}",
            font=("Arial", 14, "bold")
        ).pack(pady=(15, 3))

        ttk.Label(
            popup,
            text=item["nome"],
            font=("Arial", 12)
        ).pack()

        mensagem = item.get("mensagem", "").strip()
        if mensagem:
            ttk.Label(
                popup,
                text=mensagem,
                wraplength=320
            ).pack(pady=5)

        def confirmar():
            gerenciador.atualizar_status(entrada["id"], "Confirmado")
            atualizar_historico()
            popup.destroy()

        def adiar():
            gerenciador.atualizar_status(entrada["id"], "Adiado")
            gerenciador.adiar(item["id"])
            atualizar_historico()
            popup.destroy()

        botoes_popup = ttk.Frame(popup)
        botoes_popup.pack(pady=12)

        ttk.Button(
            botoes_popup,
            text="Confirmar",
            command=confirmar
        ).pack(side="left", padx=5)

        ttk.Button(
            botoes_popup,
            text=f"Adiar {MINUTOS_SONECA} min",
            command=adiar
        ).pack(side="left", padx=5)

    def verificar_fila():
        try:
            while True:
                item, entrada = fila_popups.get_nowait()
                mostrar_popup(item, entrada)
                atualizar_historico()
        except queue.Empty:
            pass
        janela.after(1000, verificar_fila)

    # ----- cabeçalho -----
    ttk.Label(
        janela,
        text="Cuidar+ - Lembretes e Cuidados",
        font=("Arial", 18, "bold")
    ).pack(pady=15)

    abas = ttk.Notebook(janela)
    abas.pack(fill="both", expand=True, padx=15, pady=5)

    aba_lembretes = ttk.Frame(abas)
    aba_historico = ttk.Frame(abas)
    abas.add(aba_lembretes, text="Lembretes")
    abas.add(aba_historico, text="Histórico")

    # ----- formulário -----
    tipo_var = tk.StringVar(value="Medicamento")
    nome_var = tk.StringVar()
    horario_var = tk.StringVar(value="08:00")
    mensagem_var = tk.StringVar()
    dias_vars = [tk.BooleanVar(value=True) for _ in DIAS_SEMANA]

    formulario = ttk.LabelFrame(
        aba_lembretes,
        text="Cadastrar lembrete",
        padding=12
    )
    formulario.pack(fill="x", padx=5, pady=5)

    ttk.Label(formulario, text="Tipo:").grid(
        row=0, column=0, sticky="w", padx=5, pady=5
    )
    ttk.Combobox(
        formulario,
        textvariable=tipo_var,
        values=["Medicamento", "Atividade"],
        state="readonly",
        width=18
    ).grid(row=0, column=1, sticky="ew", padx=5, pady=5)

    ttk.Label(formulario, text="Nome:").grid(
        row=1, column=0, sticky="w", padx=5, pady=5
    )
    ttk.Entry(formulario, textvariable=nome_var).grid(
        row=1, column=1, sticky="ew", padx=5, pady=5
    )

    ttk.Label(formulario, text="Horário (HH:MM):").grid(
        row=2, column=0, sticky="w", padx=5, pady=5
    )
    ttk.Entry(formulario, textvariable=horario_var, width=20).grid(
        row=2, column=1, sticky="ew", padx=5, pady=5
    )

    ttk.Label(formulario, text="Mensagem:").grid(
        row=3, column=0, sticky="w", padx=5, pady=5
    )
    ttk.Entry(formulario, textvariable=mensagem_var).grid(
        row=3, column=1, sticky="ew", padx=5, pady=5
    )

    ttk.Label(formulario, text="Dias:").grid(
        row=4, column=0, sticky="w", padx=5, pady=5
    )
    frame_dias = ttk.Frame(formulario)
    frame_dias.grid(row=4, column=1, sticky="w", padx=5, pady=5)

    for indice, nome_dia in enumerate(DIAS_SEMANA):
        ttk.Checkbutton(
            frame_dias,
            text=nome_dia,
            variable=dias_vars[indice]
        ).pack(side="left", padx=3)

    formulario.columnconfigure(1, weight=1)

    # ----- lista de lembretes -----
    colunas = ("tipo", "nome", "horario", "dias", "ativo")
    lista = ttk.Treeview(aba_lembretes, columns=colunas, show="headings")

    lista.heading("tipo", text="Tipo")
    lista.heading("nome", text="Nome")
    lista.heading("horario", text="Horário")
    lista.heading("dias", text="Dias")
    lista.heading("ativo", text="Ativo")

    lista.column("tipo", width=110)
    lista.column("nome", width=190)
    lista.column("horario", width=80)
    lista.column("dias", width=250)
    lista.column("ativo", width=70)

    def formatar_dias(dias):
        if len(dias) == 7:
            return "Todos os dias"
        return ", ".join(DIAS_SEMANA[d] for d in sorted(dias))

    def atualizar_lista():
        lista.delete(*lista.get_children())

        for item in gerenciador.lembretes:
            lista.insert(
                "",
                "end",
                iid=item["id"],
                values=(
                    item["tipo"],
                    item["nome"],
                    item["horario"],
                    formatar_dias(item.get("dias", list(range(7)))),
                    "Sim" if item.get("ativo", True) else "Não"
                )
            )

    # ----- ações -----
    def adicionar_lembrete():
        tipo = tipo_var.get()
        nome = nome_var.get().strip()
        horario = horario_var.get().strip()
        mensagem = mensagem_var.get().strip()
        dias = [i for i, var in enumerate(dias_vars) if var.get()]

        if not nome:
            messagebox.showwarning("Atenção", "Digite o nome do lembrete.")
            return

        try:
            datetime.strptime(horario, "%H:%M")
        except ValueError:
            messagebox.showwarning(
                "Horário inválido",
                "Digite o horário no formato 08:30."
            )
            return

        if not dias:
            messagebox.showwarning(
                "Atenção",
                "Selecione ao menos um dia da semana."
            )
            return

        gerenciador.adicionar(tipo, nome, horario, mensagem, dias)
        atualizar_lista()

        nome_var.set("")
        mensagem_var.set("")

        messagebox.showinfo(
            "Lembrete cadastrado",
            f"{nome} foi programado para {horario}."
        )

    def excluir_lembrete():
        selecionado = lista.selection()

        if not selecionado:
            messagebox.showwarning(
                "Atenção",
                "Selecione um lembrete para excluir."
            )
            return

        gerenciador.excluir(selecionado[0])
        atualizar_lista()

    def alternar_lembrete():
        selecionado = lista.selection()

        if not selecionado:
            messagebox.showwarning(
                "Atenção",
                "Selecione um lembrete para ativar ou desativar."
            )
            return

        gerenciador.alternar_ativo(selecionado[0])
        atualizar_lista()

    def testar_notificacao():
        gerenciador.enviar_notificacao(
            "Cuidar+ 🔔",
            "As notificações de teste estão funcionando!"
        )

    botoes = ttk.Frame(aba_lembretes)
    botoes.pack(fill="x", padx=5, pady=8)

    ttk.Button(
        botoes, text="Adicionar lembrete", command=adicionar_lembrete
    ).pack(side="left", padx=4)

    ttk.Button(
        botoes, text="Ativar/Desativar", command=alternar_lembrete
    ).pack(side="left", padx=4)

    ttk.Button(
        botoes, text="Excluir selecionado", command=excluir_lembrete
    ).pack(side="left", padx=4)

    ttk.Button(
        botoes, text="Testar notificação", command=testar_notificacao
    ).pack(side="left", padx=4)

    lista.pack(fill="both", expand=True, padx=5, pady=5)

    # ----- aba de histórico -----
    colunas_hist = ("data_hora", "tipo", "nome", "status")
    lista_hist = ttk.Treeview(
        aba_historico, columns=colunas_hist, show="headings"
    )

    lista_hist.heading("data_hora", text="Data e hora")
    lista_hist.heading("tipo", text="Tipo")
    lista_hist.heading("nome", text="Nome")
    lista_hist.heading("status", text="Status")

    lista_hist.column("data_hora", width=140)
    lista_hist.column("tipo", width=110)
    lista_hist.column("nome", width=230)
    lista_hist.column("status", width=110)

    def atualizar_historico():
        lista_hist.delete(*lista_hist.get_children())

        for entrada in reversed(gerenciador.historico):
            lista_hist.insert(
                "",
                "end",
                iid=entrada["id"],
                values=(
                    entrada["data_hora"],
                    entrada["tipo"],
                    entrada["nome"],
                    entrada["status"]
                )
            )

    def limpar_historico():
        if messagebox.askyesno(
            "Limpar histórico",
            "Deseja apagar todo o histórico?"
        ):
            gerenciador.limpar_historico()
            atualizar_historico()

    ttk.Button(
        aba_historico, text="Limpar histórico", command=limpar_historico
    ).pack(anchor="w", padx=5, pady=8)

    lista_hist.pack(fill="both", expand=True, padx=5, pady=5)

    # ----- início -----
    atualizar_lista()
    atualizar_historico()
    gerenciador.iniciar()
    verificar_fila()

    def ao_fechar():
        gerenciador.parar()
        janela.destroy()

    janela.protocol("WM_DELETE_WINDOW", ao_fechar)
    janela.mainloop()


if __name__ == "__main__":
    iniciar_app()