def detect_anomalies(transactions):
    amounts = [transaction["amount"] for transaction in transactions]

    if len(amounts) < 2:
        return [{**transaction, "anomaly": False} for transaction in transactions]

    mean_amount = sum(amounts) / len(amounts)
    variance = sum((amount - mean_amount) ** 2 for amount in amounts) / len(amounts)
    std_dev = variance ** 0.5

    if std_dev == 0:
        return [{**transaction, "anomaly": False} for transaction in transactions]

    return [
        {
            **transaction,
            "anomaly": abs((transaction["amount"] - mean_amount) / std_dev) > 2,
        }
        for transaction in transactions
    ]
