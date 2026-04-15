from api.services.bank_statement_service import process_bank_statement


def processBankStatement(pdfPath: str):
    return process_bank_statement(pdfPath)
