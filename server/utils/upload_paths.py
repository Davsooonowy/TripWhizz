import os

def upload_path(instance, filename, prefix='media'):
    ext = filename.split('.')[-1]

    if hasattr(instance, 'email'):
        sanitized_email = instance.email.replace('@', '_at_').replace('.', '_dot_')
        filename = f"{sanitized_email}.{ext}"
    elif hasattr(instance, 'name'):
        name = instance.name.replace(' ', '_') + str(instance.pk)
        filename = f"{name}.{ext}"
    else:
        raise ValueError("Unsupported instance type for upload path generation.")

    return os.path.join(prefix, filename)
