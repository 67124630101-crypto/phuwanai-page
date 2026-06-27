import json
import sys
from datetime import datetime
from pathlib import Path

from flask import Flask, jsonify, request

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "daily_horoscope.json"

SIGN_MAP = {
    "aries": "เมษ",
    "เมษ": "เมษ",
    "taurus": "พฤษภ",
    "พฤษภ": "พฤษภ",
    "gemini": "เมถุน",
    "เมถุน": "เมถุน",
    "cancer": "กรกฎ",
    "กรกฎ": "กรกฎ",
    "leo": "สิงห์",
    "สิงห์": "สิงห์",
    "virgo": "กันย์",
    "กันย์": "กันย์",
    "libra": "ตุลย์",
    "ตุลย์": "ตุลย์",
    "scorpio": "พิจิก",
    "พิจิก": "พิจิก",
    "sagittarius": "ธนู",
    "ธนู": "ธนู",
    "capricorn": "มังกร",
    "มังกร": "มังกร",
    "aquarius": "กุมภ์",
    "กุมภ์": "กุมภ์",
    "pisces": "มีน",
    "มีน": "มีน",
}

PREDICTION_TEMPLATES = {
    "เมษ": {
        "message": "วันนี้เป็นวันที่คุณควรกล้าตัดสินใจและเริ่มสิ่งใหม่ด้วยความมั่นใจ",
        "color": "สีแดง",
        "advice": "ทำสิ่งที่อยากเริ่มไว้ตั้งแต่วันนี้ จะช่วยให้ชีวิตเดินหน้าได้ดีขึ้น",
    },
    "พฤษภ": {
        "message": "ความสงบและความมั่นคงจะช่วยให้คุณเจริญรุ่งเรืองในวันนี้",
        "color": "สีเขียว",
        "advice": "ให้เวลากับการคิดและวางแผนก่อนลงมือทำ",
    },
    "เมถุน": {
        "message": "การสื่อสารและความสัมพันธ์จะเป็นจุดเด่นของวันนี้",
        "color": "สีเหลือง",
        "advice": "คุยกับคนรอบข้างอย่างเปิดใจ จะได้ผลลัพธ์ที่ดี",
    },
    "กรกฎ": {
        "message": "วันนี้เหมาะกับการรับมือกับงานที่ต้องใช้ความอดทนและความรับผิดชอบ",
        "color": "สีส้ม",
        "advice": "แบ่งงานเป็นขั้นตอนเล็ก ๆ จะช่วยให้ทำสำเร็จง่ายขึ้น",
    },
    "สิงห์": {
        "message": "พลังและความมั่นใจของคุณจะดึงดูดโอกาสดีเข้ามา",
        "color": "สีทอง",
        "advice": "แสดงความสามารถของตัวเองอย่างมั่นใจและเป็นธรรมชาติ",
    },
    "กันย์": {
        "message": "วันนี้เหมาะกับการเรียนรู้และปรับปรุงสิ่งต่าง ๆ รอบตัว",
        "color": "สีฟ้า",
        "advice": "ใช้โอกาสนี้เพื่อพัฒนาตัวเองและจัดระเบียบเรื่องสำคัญ",
    },
    "ตุลย์": {
        "message": "ความสัมพันธ์และความร่วมมือจะนำมาซึ่งความสำเร็จในวันนี้",
        "color": "สีชมพู",
        "advice": "ลองคุยกับเพื่อนหรือทีมงานอย่างเปิดใจ จะช่วยให้ทุกอย่างราบรื่น",
    },
    "พิจิก": {
        "message": "ความตั้งใจและความอดทนจะช่วยให้คุณผ่านช่วงท้าทายได้",
        "color": "สีม่วง",
        "advice": "อย่ากลัวความท้าทาย แต่อย่าลืมพักผ่อนบ้าง",
    },
    "ธนู": {
        "message": "การเดินทางหรือการเรียนรู้สิ่งใหม่จะนำโชคมาให้คุณ",
        "color": "สีเทา",
        "advice": "เปิดรับประสบการณ์ใหม่ ๆ จะมีข่าวดีเข้ามา",
    },
    "มังกร": {
        "message": "วันนี้เป็นวันที่คุณควรทำงานอย่างมีวินัยและตั้งใจ",
        "color": "สีดำ",
        "advice": "รักษามาตรฐานและทำงานตามแผนจะได้ผลลัพธ์ที่ดี",
    },
    "กุมภ์": {
        "message": "ไอเดียสร้างสรรค์จะช่วยให้คุณเจอทางออกที่ดีในวันนี้",
        "color": "สีฟ้าอ่อน",
        "advice": "ลองคิดนอกกรอบและเปิดรับแนวทางใหม่ ๆ",
    },
    "มีน": {
        "message": "อารมณ์ความรู้สึกดีและความเห็นอกเห็นใจจะช่วยให้วันนี้ผ่านไปได้อย่างนุ่มนวล",
        "color": "สี aqua",
        "advice": "ให้เวลาแก่ความคิดและดูแลใจให้สงบ",
    },
}


def load_data(data_path=DATA_FILE):
    path = Path(data_path)
    if not path.exists() or path.stat().st_size == 0:
        return {"predictions": []}

    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def save_data(data, data_path=DATA_FILE):
    path = Path(data_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, ensure_ascii=False, indent=2)
        handle.write("\n")


def normalize_sign(raw_sign):
    value = raw_sign.strip().lower()
    return SIGN_MAP.get(value, "เมษ")


def generate_prediction(name, sign, input_date):
    thai_sign = normalize_sign(sign)
    template = PREDICTION_TEMPLATES[thai_sign]

    try:
        date_obj = datetime.strptime(input_date, "%Y-%m-%d")
    except ValueError:
        date_obj = datetime.now()

    weekday = date_obj.strftime("%A")
    luck_score = 70 + ((date_obj.day % 10) * 3) + (len(name) % 5)
    if luck_score > 99:
        luck_score = 99

    return {
        "name": name.strip() or "นักทดสอบ",
        "date": date_obj.strftime("%Y-%m-%d"),
        "sign": thai_sign,
        "prediction": f"{template['message']} ในวัน{weekday}",
        "luck_score": luck_score,
        "color": template["color"],
        "advice": template["advice"],
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }


def create_app(data_file=DATA_FILE):
    app = Flask(__name__)
    app.config["DATA_FILE"] = str(data_file)

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"})

    @app.post("/predict")
    def predict():
        payload = request.get_json(silent=True) or {}
        name = payload.get("name", "นักทดสอบ")
        sign = payload.get("sign", "เมษ")
        date_input = payload.get("date", datetime.now().strftime("%Y-%m-%d"))

        data = load_data(app.config["DATA_FILE"])
        prediction = generate_prediction(name, sign, date_input)
        data.setdefault("predictions", []).append(prediction)
        save_data(data, app.config["DATA_FILE"])
        return jsonify(prediction)

    @app.get("/predictions")
    def predictions():
        return jsonify(load_data(app.config["DATA_FILE"]))

    return app


def main():
    name = input("ชื่อของคุณ: ").strip() or "นักทดสอบ"
    sign = input("ราศีของคุณ (เช่น เมษ, พฤษภ, มีน): ").strip() or "เมษ"
    date_input = input("วันที่ทำนาย (YYYY-MM-DD) [เว้นว่าง=วันนี้]: ").strip() or datetime.now().strftime("%Y-%m-%d")

    data = load_data()
    prediction = generate_prediction(name, sign, date_input)
    data.setdefault("predictions", []).append(prediction)
    save_data(data)

    print("\n✅ ทำนายดวงรายวันสำเร็จ")
    print(f"ชื่อ: {prediction['name']}")
    print(f"ราศี: {prediction['sign']}")
    print(f"วันที่: {prediction['date']}")
    print(f"คำทำนาย: {prediction['prediction']}")
    print(f"เลขนำโชค: {prediction['luck_score']}")
    print(f"สีที่ควรใส่: {prediction['color']}")
    print(f"คำแนะนำ: {prediction['advice']}")
    print(f"บันทึกข้อมูลไว้ในไฟล์: {DATA_FILE.name}")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--serve":
        create_app().run(host="0.0.0.0", port=5000, debug=True)
    else:
        main()
