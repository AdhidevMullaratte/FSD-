import sys
import json
import cv2
import numpy as np
import base64
from docx import Document
from docx.shared import Inches
import tempfile
from PIL import Image
import os
import traceback

DEBUG = True

def log_debug(message):
    if DEBUG:
        print(f"[DEBUG] {message}", file=sys.stderr)
        sys.stderr.flush()

def base64_to_image(base64_str):
    log_debug("Starting base64_to_image conversion")
    try:
        img_data = base64.b64decode(base64_str)
        np_arr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        log_debug(f"Successfully converted base64 to image. Shape: {img.shape}")
        return img
    except Exception as e:
        log_debug(f"Error in base64_to_image: {str(e)}")
        raise

def numpy_to_pil(image_np):
    log_debug("Converting numpy array to PIL image")
    try:
        pil_img = Image.fromarray(cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB))
        log_debug("Successfully converted numpy to PIL")
        return pil_img
    except Exception as e:
        log_debug(f"Error in numpy_to_pil: {str(e)}")
        raise

def calculate_affected_area(image):
    log_debug("Calculating affected area")
    try:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        area = sum(cv2.contourArea(c) for c in contours)
        log_debug(f"Calculated affected area: {area} pixels")
        return area
    except Exception as e:
        log_debug(f"Error in calculate_affected_area: {str(e)}")
        raise

def generate_report(name, age, gender, weeks, before_image, after_image, change_percentage):
    log_debug("Starting report generation")
    try:
        doc = Document()
        doc.add_heading('Vitiligo Progress Report', 0)

        # Add patient info
        doc.add_paragraph(f"Name: {name}")
        doc.add_paragraph(f"Age: {age}")
        doc.add_paragraph(f"Gender: {gender}")
        doc.add_paragraph(f"Weeks Between Photos: {weeks}")
        doc.add_paragraph(f"Change in Affected Area: {change_percentage:.2f}%")

        # Create reports directory if not exists
        reports_dir = os.path.join(os.path.dirname(__file__), 'generated_reports')
        os.makedirs(reports_dir, exist_ok=True)
        log_debug(f"Reports directory: {reports_dir}")

        # Process before image
        before_temp = os.path.join(reports_dir, 'before_temp.png')
        numpy_to_pil(before_image).save(before_temp)
        doc.add_paragraph("Before Image:")
        doc.add_picture(before_temp, width=Inches(3))
        os.remove(before_temp)

        # Process after image
        after_temp = os.path.join(reports_dir, 'after_temp.png')
        numpy_to_pil(after_image).save(after_temp)
        doc.add_paragraph("After Image:")
        doc.add_picture(after_temp, width=Inches(3))
        os.remove(after_temp)

        # Save final report
        report_path = os.path.join(reports_dir, f"{name}_vitiligo_report.docx")
        doc.save(report_path)
        log_debug(f"Report successfully generated at: {report_path}")
        return report_path

    except Exception as e:
        log_debug(f"Error in generate_report: {str(e)}")
        raise

def main():
    try:
        log_debug("\n==== Starting Vitiligo Analysis ====")
        log_debug("Reading input data from stdin...")
        input_data = sys.stdin.read()
        log_debug(f"Raw input length: {len(input_data)} chars")
        
        data = json.loads(input_data)
        log_debug(f"Parsed JSON data for patient: {data['name']}")

        log_debug("\nProcessing before image...")
        before_image = base64_to_image(data['before_image'])
        log_debug(f"Before image dimensions: {before_image.shape}")

        log_debug("\nProcessing after image...")
        after_image = base64_to_image(data['after_image'])
        log_debug(f"After image dimensions: {after_image.shape}")

        log_debug("\nCalculating affected areas...")
        before_area = calculate_affected_area(before_image)
        after_area = calculate_affected_area(after_image)
        log_debug(f"Before area: {before_area} | After area: {after_area}")

        change_percentage = ((after_area - before_area) / before_area) * 100 if before_area != 0 else 0
        log_debug(f"Change percentage: {change_percentage:.2f}%")

        log_debug("\nGenerating report...")
        report_path = generate_report(
            data['name'], data['age'], data['gender'], data['weeks'],
            before_image, after_image, change_percentage
        )

        log_debug("\n==== Analysis Complete ====")
        log_debug(f"Final report path: {report_path}")
        print(json.dumps({
            "status": "success",
            "report_path": report_path,
            "before_area": before_area,
            "after_area": after_area,
            "change_percentage": change_percentage
        }))
        sys.stdout.flush()

    except Exception as e:
        log_debug("\n==== ERROR OCCURRED ====")
        log_debug(f"Error type: {type(e).__name__}")
        log_debug(f"Error message: {str(e)}")
        log_debug(f"Traceback:\n{traceback.format_exc()}")
        print(json.dumps({
            "status": "error",
            "message": str(e)
        }))
        sys.exit(1)

if __name__ == '__main__':
    log_debug("Vitiligo Tracking Script Initialized")
    main()