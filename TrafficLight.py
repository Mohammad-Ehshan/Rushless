import cv2
import numpy as np
import math

def process_frame(frame, subtractor, kernel, min_area):
    fg_mask = subtractor.apply(frame)
    _, thresh = cv2.threshold(fg_mask, 250, 255, cv2.THRESH_BINARY)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_DILATE, kernel)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    detections = []
    for cnt in contours:
        if cv2.contourArea(cnt) > min_area:
            x, y, w, h = cv2.boundingRect(cnt)
            cx = x + w // 2
            cy = y + h // 2
            detections.append(((x, y, w, h), (cx, cy)))
    return detections, thresh

def is_new_vehicle(cx, cy, counted_points, threshold=20):
    for (px, py) in counted_points:
        if math.hypot(cx - px, cy - py) < threshold:
            return False
    return True

def main():
    video_path = r"C:\Users\Swaya\Documents\Coding\Python\Opency\Trial.mp4"
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("Error: Unable to open video.")
        return

    subtractor = cv2.createBackgroundSubtractorMOG2(history=500, varThreshold=50, detectShadows=True)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    min_area = 500

    count_line = 450  # Lowered counting line
    offset = 10       # Band around the line
    counted_points = []
    vehicle_count = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        detections, binary = process_frame(frame, subtractor, kernel, min_area)
        cv2.line(frame, (0, count_line), (frame.shape[1], count_line), (255, 0, 0), 2)

        for (x, y, w, h), (cx, cy) in detections:
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
            cv2.circle(frame, (cx, cy), 5, (0, 0, 255), -1)
            if count_line - offset < cy < count_line + offset:
                if is_new_vehicle(cx, cy, counted_points):
                    vehicle_count += 1
                    counted_points.append((cx, cy))
        
        # Remove counted points that have moved well above the line so new ones can be counted later
        counted_points = [(px, py) for (px, py) in counted_points if py > count_line - offset]

        cv2.putText(frame, f"Vehicles: {vehicle_count}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)
        cv2.imshow("Vehicle Detection", frame)
        cv2.imshow("Binary Mask", binary)

        key = cv2.waitKey(30) & 0xFF
        if key == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == '__main__':
    main()
