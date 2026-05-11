extends Control

func _ready():
	print("Main scene ready!")

func _input(event):
	if event is InputEventMouseButton:
		print("Mouse clicked at: ", event.position)
		if event.pressed:
			print("Mouse button pressed!")

func _unhandled_input(event):
	if event is InputEventKey:
		print("Key pressed: ", event.keycode)
		if event.pressed and event.keycode == KEY_ESCAPE:
			print("ESC pressed - quitting!")
			get_tree().quit()
		if event.pressed and event.keycode == KEY_SPACE:
			print("SPACE pressed!")
