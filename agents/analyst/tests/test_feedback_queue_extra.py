from agents.analyst.tools.feedback_queue import FeedbackQueue


def test_feedback_queue_basic():
    q = FeedbackQueue()
    assert q.list_pending() == []
    item = {"id": 1, "note": "test"}
    q.add(item)
    assert q.list_pending() == [item]
    # submit should not raise
    q.submit({"id": 1, "decision": "approve"})