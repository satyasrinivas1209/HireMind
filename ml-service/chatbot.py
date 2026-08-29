"""
Rule-based HR assistant for HireMind.

This is intentionally NOT an LLM. It matches keywords in the user's message
to canned, policy-style HR responses. See project README for transparency notes
on extending this to a real LLM-backed assistant in the future.
"""

FALLBACK_RESPONSE = (
    "I currently specialize in HR topics such as leave, salary, payroll, and notice periods. "
    "Could you rephrase your question around one of those areas?"
)

RULES = [
    {
        "keywords": ["leave", "vacation", "pto", "time off", "holiday"],
        "response": (
            "Employees are entitled to 20 days of paid leave per year along with public holidays. "
            "Leave requests should be submitted through your manager at least 3 business days in advance."
        ),
    },
    {
        "keywords": ["salary", "pay", "payroll", "compensation", "paycheck"],
        "response": (
            "Salary is credited on the last working day of the month. "
            "Payslips are made available through the HR portal shortly after."
        ),
    },
    {
        "keywords": ["notice", "resign", "resignation", "notice period"],
        "response": (
            "The standard notice period is 60 days. This may vary based on your role and contract terms -- "
            "please check your offer letter or speak with HR for specifics."
        ),
    },
    {
        "keywords": ["benefit", "insurance", "health"],
        "response": (
            "Employees are eligible for group health insurance coverage after successful completion "
            "of the probation period. Contact HR for enrollment details."
        ),
    },
    {
        "keywords": ["hello", "hi", "hey"],
        "response": "Hello! Ask me about HR policies, leave, salary, or notice periods.",
    },
]


def get_response(message: str) -> str:
    message_lower = message.lower()

    for rule in RULES:
        if any(keyword in message_lower for keyword in rule["keywords"]):
            return rule["response"]

    return FALLBACK_RESPONSE
