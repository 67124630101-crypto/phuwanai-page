import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import datejson


def test_predict_endpoint(tmp_path):
    data_file = tmp_path / "daily_horoscope.json"
    app = datejson.create_app(data_file=data_file)
    client = app.test_client()

    response = client.post(
        "/predict",
        json={"name": "Alice", "sign": "เมษ", "date": "2026-06-27"},
    )

    assert response.status_code == 200
    body = response.get_json()
    assert body["name"] == "Alice"
    assert body["sign"] == "เมษ"
    assert data_file.exists()
