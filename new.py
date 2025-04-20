import qrcode

# Replace with your localhost or live website URL
qr_url = "http://localhost/qr-welcome.html"  

# Generate QR code
qr = qrcode.make(qr_url)

# Save the QR code image
qr.save("recycle_network_qr.png")

print("QR Code generated successfully! Check the file 'recycle_network_qr.png'.")
