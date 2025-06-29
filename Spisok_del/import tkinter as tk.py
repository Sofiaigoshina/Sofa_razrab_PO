import tkinter as tk
from tkinter import messagebox
import json
import os

SAVE_DIR = os.path.expanduser("~")
SAVE_FILE = os.path.join(SAVE_DIR, "100k1_save.json")

class Game100to1:
    def __init__(self, root):
        self.root = root
        self.root.title("100 к 1")
        self.root.geometry("900x700")

        self.teams = ["Команда 1", "Команда 2"]
        self.scores = [0, 0]
        self.strikes = [0, 0]
        self.current_team = 0
        self.answers = []
        self.points = []
        self.question = ""
        self.mistakes = [[], []]  # Список для хранения неверных ответов
        self.opened_answers = []  # Список для хранения открытых ответов

        self.init_main_menu()

    def init_main_menu(self):
        for widget in self.root.winfo_children():
            widget.destroy()

        tk.Label(self.root, text="Добро пожаловать в игру 100 к 1!", font=("Arial", 16)).pack(pady=20)

        tk.Button(self.root, text="Начать игру", command=self.init_question_setup).pack(pady=10)
        tk.Button(self.root, text="Продолжить игру", command=self.load_game).pack(pady=10)
        tk.Button(self.root, text="Выход", command=self.root.quit).pack(pady=10)

    def init_question_setup(self):
        for widget in self.root.winfo_children():
            widget.destroy()

        tk.Label(self.root, text="Введите вопрос и варианты ответов", font=("Arial", 14)).pack(pady=10)

        self.question_entry = tk.Entry(self.root, width=50)
        self.question_entry.pack(pady=5)

        self.answer_entries = []
        self.point_entries = []

        for i in range(5):
            tk.Label(self.root, text=f"Вариант ответа {i + 1}:").pack()
            answer_entry = tk.Entry(self.root, width=30)
            answer_entry.pack(pady=2)
            self.answer_entries.append(answer_entry)

            tk.Label(self.root, text="Очки:").pack()
            point_entry = tk.Entry(self.root, width=10)
            point_entry.pack(pady=2)
            self.point_entries.append(point_entry)

        buttons_frame = tk.Frame(self.root)
        buttons_frame.pack(pady=10)

        tk.Button(buttons_frame, text="Начать игру", command=self.validate_question_setup).pack(side="left", padx=5)
        tk.Button(buttons_frame, text="Назад", command=self.init_main_menu).pack(side="left", padx=5)

    def validate_question_setup(self):
        try:
            self.answers = [entry.get().strip() for entry in self.answer_entries]
            self.points = [int(entry.get().strip()) for entry in self.point_entries]
            self.question = self.question_entry.get().strip()

            if len(self.answers) != 5 or len(self.points) != 5 or not self.question:
                raise ValueError("Заполните все поля!")

            if sum(self.points) != 100:
                raise ValueError("Сумма очков должна быть равна 100!")

            sorted_answers = sorted(zip(self.answers, self.points), key=lambda x: x[1], reverse=True)
            self.answers, self.points = zip(*sorted_answers)

            self.init_team_setup()
        except ValueError as e:
            messagebox.showerror("Ошибка", str(e))

    def init_team_setup(self):
        for widget in self.root.winfo_children():
            widget.destroy()

        tk.Label(self.root, text="Введите названия команд", font=("Arial", 14)).pack(pady=10)

        self.team_entries = []
        for i in range(2):
            tk.Label(self.root, text=f"Команда {i + 1}:").pack()
            team_entry = tk.Entry(self.root, width=30)
            team_entry.pack(pady=5)
            self.team_entries.append(team_entry)

        buttons_frame = tk.Frame(self.root)
        buttons_frame.pack(pady=10)

        tk.Button(buttons_frame, text="Начать игру", command=self.start_game).pack(side="left", padx=5)
        tk.Button(buttons_frame, text="Назад", command=self.init_question_setup).pack(side="left", padx=5)
        tk.Button(buttons_frame, text="Главное меню", command=self.init_main_menu).pack(side="left", padx=5)

    def start_game(self):
        self.teams = [entry.get().strip() for entry in self.team_entries]
        if not all(self.teams):
            messagebox.showerror("Ошибка", "Введите названия обеих команд!")
            return

        self.current_team = 0
        self.scores = [0, 0]
        self.strikes = [0, 0]
        self.mistakes = [[], []]

        self.init_game_screen()

    def init_game_screen(self):
        for widget in self.root.winfo_children():
            widget.destroy()

        tk.Label(self.root, text=f"Вопрос: {self.question}", font=("Arial", 14)).pack(pady=10)

        self.answer_labels = []
        for answer, point in zip(self.answers, self.points):
            lbl = tk.Label(self.root, text="???", font=("Arial", 12), relief="groove", width=25)
            lbl.pack(pady=5)
            self.answer_labels.append(lbl)

        left_frame = tk.Frame(self.root)
        left_frame.place(x=20, y=400)

        tk.Label(left_frame, text=f"{self.teams[0]}", font=("Arial", 14)).pack()
        self.strike_labels_1 = [tk.Label(left_frame, text="X", fg="grey", font=("Arial", 14)) for _ in range(3)]
        for lbl in self.strike_labels_1:
            lbl.pack(side="left", padx=5)
        self.score_label_1 = tk.Label(left_frame, text=f"Очки: {self.scores[0]}", font=("Arial", 14))
        self.score_label_1.pack()

        self.mistakes_label_1 = tk.Label(left_frame, text="Ошибки: ", font=("Arial", 12), anchor="w", justify="left")
        self.mistakes_label_1.pack()

        right_frame = tk.Frame(self.root)
        right_frame.place(x=600, y=400)

        tk.Label(right_frame, text=f"{self.teams[1]}", font=("Arial", 14)).pack()
        self.strike_labels_2 = [tk.Label(right_frame, text="X", fg="grey", font=("Arial", 14)) for _ in range(3)]
        for lbl in self.strike_labels_2:
            lbl.pack(side="left", padx=5)
        self.score_label_2 = tk.Label(right_frame, text=f"Очки: {self.scores[1]}", font=("Arial", 14))
        self.score_label_2.pack()

        self.mistakes_label_2 = tk.Label(right_frame, text="Ошибки: ", font=("Arial", 12), anchor="w", justify="left")
        self.mistakes_label_2.pack()

        self.input_frame = tk.Frame(self.root)
        self.input_frame.pack(pady=20)

        self.answer_entry = tk.Entry(self.input_frame, width=30)
        self.answer_entry.pack(side="left", padx=10)
        tk.Button(self.root, text="Дать ответ", command=self.submit_answer).place(x=500, y=300)
        tk.Button(self.root, text="Сдаться", command=self.surrender).place(x=445, y=330)
        tk.Button(self.root, text="Сохранить игру", command=self.save_game).place(x=500, y=330)
        tk.Button(self.root, text="Назад", command=self.init_main_menu).place(x=599, y=330)

        if all(lbl.cget("text") != "???" for lbl in self.answer_labels):
            self.end_game()

    def submit_answer(self):
        answer = self.answer_entry.get().strip()
        self.answer_entry.delete(0, tk.END)

        if not answer:
            messagebox.showerror("Ошибка", "Требуется ввести вариант ответа")
            return
        
        answer_lower   = answer.lower()
        answers_lower  = list(map(str.lower, self.answers))

        if answer_lower in answers_lower:
            # Правильный ответ
            idx = answers_lower.index(answer_lower)
            if self.answer_labels[idx].cget("text") == "???":
                self.answer_labels[idx].config(text=f"{self.answers[idx]} ({self.points[idx]} очков)")
                self.scores[self.current_team] += self.points[idx]
                self.update_scores()

                if all(lbl.cget("text") != "???" for lbl in self.answer_labels):
                  # если это был последний скрытый ответ — завершаем игру
                  self.end_game()
                  return
            else:
                messagebox.showinfo("Ответ уже угадан", "Этот ответ уже открыт!")
        else:
            # Неправильный ответ
            self.strikes[self.current_team] += 1
            self.mistakes[self.current_team].append(answer)
            self.update_strikes()
            self.update_mistakes()

            # Если три промаха — сразу проигрыш
            if self.strikes[self.current_team] >= 3:
                loser  = self.teams[self.current_team]
                winner = self.teams[1 - self.current_team]
                messagebox.showinfo("Игра окончена",f"{loser} сделал три промаха и проиграл! Побеждает {winner}!")
                self.init_main_menu()
                return

            # Иначе — передаём ход сразу же
            self.current_team = 1 - self.current_team
            messagebox.showinfo("Ход передан", f"Ход переходит к {self.teams[self.current_team]}!")

            # Обновляем состояние и проверяем, не закончилась ли игра по другим причинам
            self.update_scores()
            self.check_end_game()

    def check_end_game(self):
        """Проверка, все ли ответы открыты. Если да - завершение игры."""
        if all(lbl.cget("text") != "???" for lbl in self.answer_labels):
            self.end_game()

    def end_game(self):
        """Обработка завершения игры с выводом итогового результата."""
        winner = self.teams[0] if self.scores[0] > self.scores[1] else self.teams[1]
        messagebox.showinfo("Игра завершена", f"Игра окончена! Победила команда {winner} с {max(self.scores)} очками!")
        self.init_main_menu()

    def update_scores(self):
        self.score_label_1.config(text=f"Очки: {self.scores[0]}")
        self.score_label_2.config(text=f"Очки: {self.scores[1]}")

    def update_strikes(self):
        for i in range(3):
            color = "red" if i < self.strikes[0] else "grey"
            self.strike_labels_1[i].config(fg=color)
            
        for i in range(3):
            color = "red" if i < self.strikes[1] else "grey"
            self.strike_labels_2[i].config(fg=color)

    def update_mistakes(self):
        self.mistakes_label_1.config(text="Ошибки: " + ", ".join(self.mistakes[0]))
        self.mistakes_label_2.config(text="Ошибки: " + ", ".join(self.mistakes[1]))

    def surrender(self):
        winning_team = 1 - self.current_team
        messagebox.showinfo("Сдача", f"{self.teams[self.current_team]} сдалась! Побеждает {self.teams[winning_team]}")
        self.init_main_menu()

    def save_game(self):
        game_data = {
            "teams": self.teams,
            "scores": self.scores,
            "strikes": self.strikes,
            "current_team": self.current_team,
            "question": self.question,
            "answers": self.answers,
            "points": self.points,
            "opened_answers": [label.cget("text") for label in self.answer_labels],
            "mistakes": self.mistakes,
        }
        with open(SAVE_FILE, "w", encoding="utf-8") as f:
            json.dump(game_data, f, ensure_ascii=False, indent=4)
        #messagebox.showinfo("Игра сохранена", "Текущая игра успешно сохранена!")
        messagebox.showinfo("Путь сохранения", os.path.abspath(SAVE_FILE))

    def load_game(self):
        try:
            with open(SAVE_FILE, "r", encoding="utf-8") as f:
                game_data = json.load(f)

            self.teams = game_data["teams"]
            self.scores = game_data["scores"]
            self.strikes = game_data["strikes"]
            self.current_team = game_data["current_team"]
            self.question = game_data["question"]
            self.answers = game_data["answers"]
            self.points = game_data["points"]
            self.mistakes = game_data["mistakes"]
            self.opened_answers = game_data["opened_answers"]

            self.init_game_screen()
            for idx, text in enumerate(self.opened_answers):
                self.answer_labels[idx].config(text=text)

            self.update_mistakes()
            self.update_strikes()
            self.update_scores()
        except (FileNotFoundError, json.JSONDecodeError):
            messagebox.showerror("Ошибка", "Нет сохранённой игры для загрузки!")


if __name__ == "__main__":
    root = tk.Tk()
    app = Game100to1(root)
    root.mainloop()
