"""Names the yellow blanks in the starter policy templates, so the product can fill them in.

    python docs/dev/name-template-blanks.py

The ISMS document set (00 to 13) is built with its blanks already named, by a generator that
is not in this repository. The seven starter policies were made another way, so this
reads their finished Word files, wraps every yellow <placeholder> in a content control
tagged with its name, and adds the seven to packs/assure/templates/fields.json.

It can be run again: a blank that already has a name is left alone, and the seven's entries
in fields.json are replaced, not added to.

A blank gets a name in one of three ways:
  - in the document information table or the version history: the document's own owner,
    approver and dates ($owner, $approver, $approval_date, $next_review), which the
    product takes from the Policies screen when the policy is recorded there;
  - one that means the same thing in every document (<Company name>): the shared answer;
  - anything else: NN.bN, a blank of its own, asked as a question in the sentence it sits in.
"""
import json
import re
import sys
import zipfile
from pathlib import Path

PACK = Path(__file__).resolve().parents[2] / "packs" / "assure" / "templates"
FILES = [
    ("Master_Information_Security_Policy.docx", "P1"),
    ("Acceptable_Use_Policy.docx", "P2"),
    ("Employee_Handbook_HR_Security.docx", "P3"),
    ("IT_Security_Operations_Manual.docx", "P4"),
    ("Incident_Response_and_BCP.docx", "P5"),
    ("Vendor_Supplier_Management_Policy.docx", "P6"),
    ("Context_of_the_Organisation_Clause4.docx", "P7"),
]
SHARED = {
    "<Company name>": "company",
    "<contact or mailbox>": "security_contact",
    "<IT contact or mailbox>": "security_contact",
    "<ISMS manager role>": "isms_manager_title",
}
SIGNATURE = {"<name>", "<date>", "<placeholder>"}
INFO = {"Owner": "$owner", "Approver": "$approver", "Effective date": "$approval_date",
        "Next review": "$next_review"}
HISTORY = {1: "$approval_date", 2: "$owner", 3: "$approver"}

RUN = re.compile(r"<w:r>(?:(?!</w:r>).)*?</w:r>", re.S)
YELLOW = 'w:highlight w:val="yellow"'
TEXT = re.compile(r"<w:t(?: [^>]*)?>([^<]*)</w:t>")


def unesc(s):
    return s.replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", '"').replace("&apos;", "'").replace("&amp;", "&")


def esc(s):
    return s.replace("&", "&amp;").replace('"', "&quot;")


def text_of(xml):
    return unesc("".join(TEXT.findall(xml)))


def wrap(run, tag, alias):
    return (f'<w:sdt><w:sdtPr><w:alias w:val="{esc(alias[:60])}"/><w:tag w:val="{esc(tag)}"/></w:sdtPr>'
            f"<w:sdtContent>{run}</w:sdtContent></w:sdt>")


def is_blank(run):
    return YELLOW in run and re.fullmatch(r"<[^<>]+>", text_of(run).strip()) is not None


def sentence(par_xml, which):
    """The paragraph's words, with blank number `which` shown as ..."""
    out, n = [], -1
    for run in RUN.findall(par_xml):
        t = text_of(run)
        if is_blank(run):
            n += 1
            out.append("..." if n == which else t.strip("<>"))
        else:
            out.append(t)
    return "".join(out).strip()


def process(path, code):
    entries = zipfile.ZipFile(path).infolist()
    zin = zipfile.ZipFile(path)
    data = {e.filename: zin.read(e.filename) for e in entries}
    xml = data["word/document.xml"].decode("utf8")
    fields, items, shared_used = {}, [], []
    counter = [0]

    # What kind of table is each one, and what does each cell sit under?
    def table_fix(m):
        tbl = m.group(0)
        rows = re.findall(r"<w:tr[ >].*?</w:tr>", tbl, re.S)
        if not rows:
            return tbl
        head = [text_of(c).strip() for c in re.findall(r"<w:tc>.*?</w:tc>", rows[0], re.S)]
        history = head[:3] == ["Version", "Date", "Author"]
        out = tbl
        for ri, row in enumerate(rows):
            cells = re.findall(r"<w:tc>.*?</w:tc>", row, re.S)
            new_row = row
            for ci, cell in enumerate(cells):
                if YELLOW not in cell or "<w:sdt>" in cell:
                    continue
                key = None
                if history and ri > 0:
                    key = HISTORY.get(ci)
                elif ci == 1 and len(cells) == 2:
                    key = INFO.get(text_of(cells[0]).strip())
                if key:
                    fixed = RUN.sub(lambda r: wrap(r.group(0), key, text_of(r.group(0)).strip("<>"))
                                    if is_blank(r.group(0)) else r.group(0), cell)
                    new_row = new_row.replace(cell, fixed, 1)
            out = out.replace(row, new_row, 1)
        return out

    xml = re.sub(r"<w:tbl>.*?</w:tbl>", table_fix, xml, flags=re.S)

    # Everything else, paragraph by paragraph, remembering the numbered heading and the table heading.
    section = ""
    in_instructions = True

    def table_labels(tbl):
        rows = re.findall(r"<w:tr[ >].*?</w:tr>", tbl, re.S)
        head = [text_of(c).strip() for c in re.findall(r"<w:tc>.*?</w:tc>", rows[0], re.S)] if rows else []
        return head

    def mark_unmarked(p):
        """A <blank> written inside ordinary text, without the yellow: split it out and highlight it."""
        def split(r):
            run = r.group(0)
            if YELLOW in run:
                return run
            t = text_of(run)
            found = list(re.finditer(r"<[^<>]{3,400}>", t))
            if not found:
                return run
            rpr = re.search(r"<w:rPr>.*?</w:rPr>", run, re.S)
            rpr = rpr.group(0) if rpr else "<w:rPr></w:rPr>"
            yellow = rpr.replace("</w:rPr>", '<w:highlight w:val="yellow"/></w:rPr>')

            def piece(props, text):
                if not text:
                    return ""
                safe = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                return f'<w:r>{props}<w:t xml:space="preserve">{safe}</w:t></w:r>'

            out, at = [], 0
            for m in found:
                out.append(piece(rpr, t[at:m.start()]))
                out.append(piece(yellow, m.group(0)))
                at = m.end()
            out.append(piece(rpr, t[at:]))
            return "".join(out)
        return RUN.sub(split, p)

    def para(m, label=None, in_table=False):
        nonlocal section, in_instructions
        p = m.group(0)
        if not in_instructions and 'w:type="page"' not in p:
            p = mark_unmarked(p)
        plain = text_of(p).strip()
        if 'w:type="page"' in p:
            in_instructions = False
        if re.match(r"\d+\.\s", plain) and not in_instructions:
            section = plain
        if in_instructions or not any(is_blank(r) for r in RUN.findall(p)):
            return p
        which = -1
        out = []
        # A blank already inside a content control keeps its name; count it and move on.
        for part in re.split(r"(<w:sdt>.*?</w:sdt>)", p, flags=re.S):
            named = part.startswith("<w:sdt>")
            for run in RUN.findall(part):
                if not is_blank(run):
                    continue
                which += 1
                if named:
                    continue
                shown = text_of(run).strip()
                if in_table and shown in SIGNATURE:
                    continue  # a line to sign by hand, not a question
                if shown in SHARED:
                    key = SHARED[shown]
                    if key not in shared_used:
                        shared_used.append(key)
                else:
                    counter[0] += 1
                    key = f"{code}.b{counter[0]}"
                    fields[key] = dict(label=label or "", hint=shown.strip("<>"), default="", long=False,
                                       context=sentence(p, which))
                    items.append(dict(t="field", name=key, section=section or "Document"))
                part = part.replace(run, wrap(run, key, shown.strip("<>")), 1)
            out.append(part)
        return "".join(out)

    def table_para(m):
        tbl = m.group(0)
        head = table_labels(tbl)
        rows = re.findall(r"<w:tr[ >].*?</w:tr>", tbl, re.S)
        out = tbl
        for ri, row in enumerate(rows):
            cells = re.findall(r"<w:tc>.*?</w:tc>", row, re.S)
            first = text_of(cells[0]).strip() if cells else ""
            new_row = row
            for ci, cell in enumerate(cells):
                if YELLOW not in cell and not re.search(r"&lt;[^<>&]{3,400}&gt;", cell):
                    continue
                # "Owner: Password manager", from the column heading and the row's first cell.
                label = None
                if ri > 0 and ci > 0 and ci < len(head) and head[ci] and first and "<" not in first:
                    label = f"{head[ci]}: {first}"
                fixed = re.sub(r"<w:p[ >].*?</w:p>", lambda pm: para(pm, label, True), cell, flags=re.S)
                new_row = new_row.replace(cell, fixed, 1)
            out = out.replace(row, new_row, 1)
        return out

    # Tables first (with their labels), then the paragraphs outside them.
    placeholder_tbl = {}

    def hold(m):
        key = f"@@TBL{len(placeholder_tbl)}@@"
        placeholder_tbl[key] = m.group(0)
        return key

    body = re.sub(r"<w:tbl>.*?</w:tbl>", hold, xml, flags=re.S)
    # walk in document order so the numbered heading is right for every table
    pieces = re.split(r"(@@TBL\d+@@)", body)
    result = []
    for piece in pieces:
        if piece.startswith("@@TBL"):
            result.append(table_para(re.match(r".*", placeholder_tbl[piece], re.S)))
        else:
            result.append(re.sub(r"<w:p[ >].*?</w:p>", para, piece, flags=re.S))
    xml = "".join(result)

    # The page header can carry a blank too (<Company name>).
    for name in list(data):
        if re.fullmatch(r"word/(header|footer)\d*\.xml", name):
            h = data[name].decode("utf8")
            if YELLOW in h and "<w:sdt>" not in h:
                def hrun(r):
                    run = r.group(0)
                    if not is_blank(run):
                        return run
                    shown = text_of(run).strip()
                    key = SHARED.get(shown)
                    if not key:
                        counter[0] += 1
                        key = f"{code}.b{counter[0]}"
                        fields[key] = dict(label="Page header", hint=shown.strip("<>"), default="", long=False, context="")
                        items.append(dict(t="field", name=key, section="Page header"))
                    elif key not in shared_used:
                        shared_used.append(key)
                    return wrap(run, key, shown.strip("<>"))
                data[name] = RUN.sub(hrun, h).encode("utf8")
    data["word/document.xml"] = xml.encode("utf8")

    doc_id = re.search(r"Document ID.*?<w:t[^>]*>([^<]+)</w:t>.*?<w:t[^>]*>([^<]+)</w:t>", xml, re.S)
    return data, entries, fields, items, shared_used, doc_id.group(1) if doc_id else ""


def write(path, data, entries):
    tmp = path.with_suffix(".tmp")
    with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as z:
        for e in entries:
            z.writestr(e.filename, data[e.filename])
    tmp.replace(path)


def main():
    manifest_path = PACK / "fields.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf8"))
    index = {d["file"]: d["title"] for d in json.loads((PACK / "index.json").read_text(encoding="utf8"))["documents"]}
    mine = {f for f, _ in FILES}
    manifest["documents"] = [d for d in manifest["documents"] if d["file"] not in mine]
    for filename, code in FILES:
        path = PACK / filename
        data, entries, fields, items, shared_used, doc_id = process(path, code)
        write(path, data, entries)
        manifest["documents"].append(dict(
            file=filename, no=code, title=index.get(filename, filename), id=doc_id,
            items=items, fields=fields, shared=shared_used))
        print(f"{filename}: {len(fields)} own blanks, shared {shared_used}")
    manifest_path.write_text(json.dumps(manifest, indent=1, ensure_ascii=False) + "\n", encoding="utf8")


if __name__ == "__main__":
    sys.exit(main())
