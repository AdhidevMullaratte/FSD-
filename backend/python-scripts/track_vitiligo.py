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

def base64_to_image(base64_str):
    print("Converting base64 to image...")
    img_data = base64.b64decode(base64_str)
    np_arr = np.frombuffer(img_data, np.uint8)
    return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

def numpy_to_pil(image_np):
    print("Converting numpy array to PIL image...")
    return Image.fromarray(cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB))

def calculate_affected_area(image):
    print("Calculating affected area...")
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    area = sum(cv2.contourArea(c) for c in contours)
    print(f"Calculated affected area: {area} pixels")
    return area

def generate_report(name, age, gender, weeks, before_image, after_image, change_percentage):
    print("Generating report document...")
    doc = Document()
    doc.add_heading('Vitiligo Progress Report', 0)

    # Add patient information
    print("Adding patient information to report...")
    doc.add_paragraph(f"Name: {name}")
    doc.add_paragraph(f"Age: {age}")
    doc.add_paragraph(f"Gender: {gender}")
    doc.add_paragraph(f"Weeks Between Photos: {weeks}")
    doc.add_paragraph(f"Change in Affected Area: {change_percentage:.2f}%")

    # Add before image
    print("Processing before image...")
    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as before_file:
        numpy_to_pil(before_image).save(before_file.name)
        print(f"Before image saved to temporary file: {before_file.name}")
        doc.add_paragraph("Before Image:")
        doc.add_picture(before_file.name, width=Inches(3))
        os.unlink(before_file.name)  # Clean up temporary file

    # Add after image
    print("Processing after image...")
    with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as after_file:
        numpy_to_pil(after_image).save(after_file.name)
        print(f"After image saved to temporary file: {after_file.name}")
        doc.add_paragraph("After Image:")
        doc.add_picture(after_file.name, width=Inches(3))
        os.unlink(after_file.name)  # Clean up temporary file

    # Save final report
    report_path = tempfile.NamedTemporaryFile(delete=False, suffix=".docx").name
    doc.save(report_path)
    print(f"Report generated at: {report_path}")
    return report_path

def main():
    try:
        print("\n==== Starting Vitiligo Analysis ====")
        print("Reading input data from stdin...")
        input_data = sys.stdin.read()
        
        print("Parsing JSON input...")
        data = json.loads(input_data)
        print(f"Received data for patient: {data['name']}")

        print("\nProcessing before image...")
        before_image = base64_to_image(data['before_image'])
        print("Before image dimensions:", before_image.shape)

        print("\nProcessing after image...")
        after_image = base64_to_image(data['after_image'])
        print("After image dimensions:", after_image.shape)

        print("\nCalculating affected areas...")
        before_area = calculate_affected_area(before_image)
        after_area = calculate_affected_area(after_image)
        print(f"Before area: {before_area} | After area: {after_area}")

        if before_area == 0:
            change_percentage = 0.0
            print("Warning: Before area is 0, setting change percentage to 0")
        else:
            change_percentage = ((after_area - before_area) / before_area) * 100
            print(f"Change percentage: {change_percentage:.2f}%")

        print("\nGenerating report...")
        report_path = generate_report(
            data['name'], data['age'], data['gender'], data['weeks'],
            before_image, after_image, change_percentage
        )

        print("\n==== Analysis Complete ====")
        print(f"Final report path: {report_path}")
        print(json.dumps({"report_path": report_path}))
        sys.stdout.flush()

    except Exception as e:
        print("\n==== ERROR OCCURRED ====", file=sys.stderr)
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.stderr.flush()
        sys.exit(1)

if __name__ == '__main__':
    print("Vitiligo Tracking Script Initialized")
    main()