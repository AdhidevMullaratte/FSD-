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

def segment_vitiligo(image):
    log_debug("Segmenting vitiligo areas")
    try:
        # Convert to LAB color space - often better for skin condition detection
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        
        # Split channels
        l, a, b = cv2.split(lab)
        
        # Apply thresholding on the L channel (lightness)
        _, thresh = cv2.threshold(l, 180, 255, cv2.THRESH_BINARY)
        
        # Morphological operations to clean up the mask
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5,5))
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=2)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
        
        # Create segmented image (highlight affected areas in red)
        segmented = image.copy()
        segmented[thresh == 255] = (0, 0, 255)  # Highlight in red
        
        # Create overlay with transparency
        overlay = image.copy()
        cv2.addWeighted(segmented, 0.5, overlay, 0.5, 0, overlay)
        
        log_debug("Successfully segmented vitiligo areas")
        return thresh, overlay
    except Exception as e:
        log_debug(f"Error in segment_vitiligo: {str(e)}")
        raise

def calculate_affected_area(mask):
    log_debug("Calculating affected area")
    try:
        area = cv2.countNonZero(mask)
        log_debug(f"Calculated affected area: {area} pixels")
        return area
    except Exception as e:
        log_debug(f"Error in calculate_affected_area: {str(e)}")
        raise

def generate_report(name, age, gender, weeks, before_image, after_image, before_segmented, after_segmented, change_percentage):
    log_debug("Starting report generation")
    try:
        doc = Document()
        doc.add_heading('Vitiligo Progress Report', 0)

        # Add patient info
        doc.add_paragraph(f"Name: {name}", style='Heading 2')
        doc.add_paragraph(f"Age: {age}")
        doc.add_paragraph(f"Gender: {gender}")
        doc.add_paragraph(f"Weeks Between Photos: {weeks}")
        doc.add_paragraph(f"Change in Affected Area: {change_percentage:.2f}%", style='Heading 3')

        # Create reports directory if not exists
        reports_dir = os.path.join(os.path.dirname(__file__), 'generated_reports')
        os.makedirs(reports_dir, exist_ok=True)
        log_debug(f"Reports directory: {reports_dir}")

        # Add before images section
        doc.add_heading('Before Treatment', level=2)
        
        # Original before image
        before_temp = os.path.join(reports_dir, 'before_temp.png')
        numpy_to_pil(before_image).save(before_temp)
        doc.add_paragraph("Original Image:")
        doc.add_picture(before_temp, width=Inches(3))
        
        # Segmented before image
        before_seg_temp = os.path.join(reports_dir, 'before_seg_temp.png')
        numpy_to_pil(before_segmented).save(before_seg_temp)
        doc.add_paragraph("Segmented Image (affected areas in red):")
        doc.add_picture(before_seg_temp, width=Inches(3))

        # Add after images section
        doc.add_heading('After Treatment', level=2)
        
        # Original after image
        after_temp = os.path.join(reports_dir, 'after_temp.png')
        numpy_to_pil(after_image).save(after_temp)
        doc.add_paragraph("Original Image:")
        doc.add_picture(after_temp, width=Inches(3))
        
        # Segmented after image
        after_seg_temp = os.path.join(reports_dir, 'after_seg_temp.png')
        numpy_to_pil(after_segmented).save(after_seg_temp)
        doc.add_paragraph("Segmented Image (affected areas in red):")
        doc.add_picture(after_seg_temp, width=Inches(3))

        # Clean up temp files
        os.remove(before_temp)
        os.remove(before_seg_temp)
        os.remove(after_temp)
        os.remove(after_seg_temp)

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

        log_debug("\nSegmenting images...")
        before_mask, before_segmented = segment_vitiligo(before_image)
        after_mask, after_segmented = segment_vitiligo(after_image)

        log_debug("\nCalculating affected areas...")
        before_area = calculate_affected_area(before_mask)
        after_area = calculate_affected_area(after_mask)
        log_debug(f"Before area: {before_area} | After area: {after_area}")

        change_percentage = ((after_area - before_area) / before_area) * 100 if before_area != 0 else 0
        log_debug(f"Change percentage: {change_percentage:.2f}%")

        log_debug("\nGenerating report...")
        report_path = generate_report(
            data['name'], data['age'], data['gender'], data['weeks'],
            before_image, after_image, before_segmented, after_segmented, change_percentage
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