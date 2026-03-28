import os

def folder_to_mermaid(path, parent_name="Root"):
    """
    Recursively scan folder and generate Mermaid syntax
    """
    lines = [f'{parent_name}["{os.path.basename(path) or path}"]']
    
    for item in os.listdir(path):
        if item in ['.git', 'node_modules', '__pycache__']:  # skip unnecessary folders
            continue

        item_path = os.path.join(path, item)
        safe_item_name = item.replace("-", "_").replace(".", "_")  # Mermaid-safe
        if os.path.isdir(item_path):
            lines.append(f'{parent_name} --> {safe_item_name}["{item}"]')
            lines.extend(folder_to_mermaid(item_path, safe_item_name))
        else:
            lines.append(f'{parent_name} --> {safe_item_name}["{item}"]')
    
    return lines

def generate_mermaid(path="."):
    mermaid_lines = folder_to_mermaid(path)
    return "graph TD\n" + "\n".join(mermaid_lines)

if __name__ == "__main__":
    mermaid_content = generate_mermaid("./")  # scan current directory

    # Overwrite claude.md with Mermaid diagram + usage placeholder
    with open("claude.md", "w") as f:
        f.write("# Project Name\n\n")
        f.write("## Folder Structure\n\n")
        f.write("```mermaid\n")
        f.write(mermaid_content)
        f.write("\n```\n")
        f.write("\n## Usage\n\n")
        f.write("# Add usage instructions here\n")

    print("✅ claude.md updated with Mermaid diagram!")