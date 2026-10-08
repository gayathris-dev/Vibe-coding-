import os
import zipfile
from pathlib import Path

def create_project_zip():
    base_dir = Path("d:/hackthon/pro")
    output_zip = Path("d:/hackthon/BNP_Self_Healing_Controller.zip")
    output_zip_local = Path("d:/hackthon/pro/BNP_Self_Healing_Controller.zip")
    
    exclude_dirs = {"venv", "node_modules", ".pytest_cache", "__pycache__", ".git", "dist", "temp_zip_staging"}
    exclude_extensions = {".pyc", ".pyo", ".pyd"}

    print(f"[INFO] Archiving {base_dir} to {output_zip}...")
    
    with zipfile.ZipFile(output_zip, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zipf:
        for root, dirs, files in os.walk(base_dir):
            # Modify dirs in-place to avoid recursing into excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if file.endswith(".zip") or file in {".DS_Store", "Thumbs.db"}:
                    continue
                if any(file.endswith(ext) for ext in exclude_extensions):
                    continue
                    
                full_path = Path(root) / file
                rel_path = full_path.relative_to(base_dir)
                
                # Double check no excluded parts in rel_path
                parts = set(rel_path.parts)
                if parts.intersection(exclude_dirs):
                    continue
                
                zipf.write(full_path, arcname=str(rel_path))

    # Also copy locally
    import shutil
    shutil.copyfile(output_zip, output_zip_local)

    size_mb = os.path.getsize(output_zip) / (1024 * 1024)
    print(f"[SUCCESS] Zip created successfully!")
    print(f"Path: {output_zip}")
    print(f"Size: {size_mb:.2f} MB")

if __name__ == "__main__":
    create_project_zip()
