#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ระบบให้เกรดตามคะแนน (Grade System)
โปรแกรมนี้ใช้ดำเนินการตามไฟล์ Flowchart
"""

def get_grade(score):
    """
    ฟังก์ชันคำนวณเกรดตามคะแนน
    
    เกรดการให้:
    - A: คะแนน >= 80
    - B: คะแนน >= 70
    - C: คะแนน >= 60
    - D: คะแนน >= 50
    - F: คะแนน < 50
    """
    if score >= 80:
        return "A", "ดีเยี่ยม"
    elif score >= 70:
        return "B", "ดี"
    elif score >= 60:
        return "C", "ปานกลาง"
    elif score >= 50:
        return "D", "อ่อน"
    else:
        return "F", "ตกลอม"


def print_header():
    """พิมพ์ส่วนหัวของโปรแกรม"""
    print("=" * 50)
    print("    ระบบการให้เกรดตามคะแนน (Grade System)")
    print("=" * 50)
    print()


def print_grade_scale():
    """พิมพ์ตารางการให้เกรด"""
    print("📊 ตารางการให้เกรด:")
    print("-" * 50)
    print("เกรด | ช่วงคะแนน | คำอธิบาย")
    print("-" * 50)
    print("  A  |  >= 80    | ดีเยี่ยม (Excellent)")
    print("  B  |  >= 70    | ดี (Good)")
    print("  C  |  >= 60    | ปานกลาง (Fair)")
    print("  D  |  >= 50    | อ่อน (Poor)")
    print("  F  |  < 50     | ตกลอม (Fail)")
    print("-" * 50)
    print()


def main():
    """ฟังก์ชันหลักของโปรแกรม"""
    print_header()
    print_grade_scale()
    
    while True:
        try:
            # รับคะแนนจากผู้ใช้
            score_input = input("🎯 กรุณาป้อนคะแนน (0-100) หรือ 'exit' เพื่อออก: ").strip()
            
            # ตรวจสอบการออก
            if score_input.lower() == 'exit':
                print("\n👋 ขอบคุณที่ใช้ระบบ! ลาก่อนครับ/ค่ะ")
                break
            
            # แปลงเป็นตัวเลข
            score = float(score_input)
            
            # ตรวจสอบช่วงคะแนน
            if score < 0 or score > 100:
                print("❌ ข้อผิดพลาด: คะแนนต้องอยู่ในช่วง 0-100 เท่านั้น")
                print()
                continue
            
            # คำนวณเกรด
            grade, description = get_grade(score)
            
            # แสดงผล
            print("\n" + "=" * 50)
            print("📝 ผลการประเมิน:")
            print("=" * 50)
            print(f"  คะแนน      : {score:.2f} คะแนน")
            print(f"  เกรด       : {grade}")
            print(f"  อธิบาย     : {description}")
            print("=" * 50)
            print()
            
        except ValueError:
            print("❌ ข้อผิดพลาด: กรุณาป้อนตัวเลขที่ถูกต้อง")
            print()
        except KeyboardInterrupt:
            print("\n\n👋 ขอบคุณที่ใช้ระบบ! ลาก่อนครับ/ค่ะ")
            break


if __name__ == "__main__":
    main()
