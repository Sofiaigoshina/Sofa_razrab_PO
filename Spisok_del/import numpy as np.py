import numpy as np
from scipy.optimize import minimize_scalar

# Целевая функция
def f(x):
    x1, x2 = x
    return 2 * x1**2 + x2**2 - x1 * x2 + x1

# Градиент функции
def grad_f(x):
    x1, x2 = x
    df_dx1 = 4 * x1 - x2 + 1
    df_dx2 = 2 * x2 - x1
    return np.array([df_dx1, df_dx2])

# Одномерная функция для поиска шага t
def phi(t, xk, grad):
    return f(xk - t * grad)

# Метод наискорейшего градиентного спуска
def gradient_descent(x0, eps1=0.1, eps2=0.15, M=10):
    xk = np.array(x0, dtype=float)
    k = 0

    while True:
        print(f"\nШаг {k}")

        grad = grad_f(xk)
        grad_norm = np.linalg.norm(grad)
        print(f"∇f(x^{k}) = {grad}")
        print(f"||∇f(x^{k})|| = {grad_norm:.4f}")

        # Сравнение с ε1
        if grad_norm < eps1:
            print(f"Сравниваем: ||∇f|| = {grad_norm:.4f} < ε1 = {eps1} → ДА (завершение)")
            break
        else:
            print(f"Сравниваем: ||∇f|| = {grad_norm:.4f} ≥ ε1 = {eps1} → НЕТ")

        # Проверка предельного числа итераций
        if k >= M:
            print(f"k = {k} ≥ M = {M} → Достигнут предел итераций (завершение)")
            break
        else:
            print(f"k = {k} < M = {M} → продолжаем")

        # Поиск t*
        res = minimize_scalar(lambda t: phi(t, xk, grad))
        t_star = res.x
        print(f"t* = {t_star:.4f}")

        # Новая точка
        x_next = xk - t_star * grad
        print(f"x^{k+1} = {x_next}")

        # Проверка изменений
        dx = np.linalg.norm(x_next - xk)
        df_val = abs(f(x_next) - f(xk))

        sign_dx = "<=" if dx <= eps2 else ">"
        sign_df = "<=" if df_val <= eps2 else ">"

        print(f"||x^{k+1} - x^{k}|| = {dx:.4f} {sign_dx} ε2 = {eps2} → {'ДА' if dx <= eps2 else 'НЕТ'}")
        print(f"|f(x^{k+1}) - f(x^{k})| = {df_val:.4f} {sign_df} ε2 = {eps2} → {'ДА' if df_val <= eps2 else 'НЕТ'}")

        if dx <= eps2 and df_val <= eps2:
            print("Оба условия ε2 выполнены → Завершение")
            xk = x_next
            break

        xk = x_next
        k += 1

    print("\nМинимум функции достигается в точке:", xk)
    print("Значение функции в этой точке:", f(xk))
    return xk

# Запуск
x0 = [2, 2]
gradient_descent(x0)
