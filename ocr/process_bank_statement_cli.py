import json
import sys

from api.services.bank_statement_service import process_bank_statement


def main() -> int:
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: process_bank_statement_cli.py <pdf_path>"}))
        return 1

    result = process_bank_statement(sys.argv[1])
    print(json.dumps(result))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
