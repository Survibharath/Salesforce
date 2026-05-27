from flask import Flask, jsonify
from flask_cors import CORS
import subprocess
import json

app = Flask(__name__)

CORS(app)


@app.route("/")
def home():

    return "Salesforce Org Insight Engine Running"


@app.route("/objects", methods=["GET"])
def get_objects():

    try:

        command = "sf force schema sobject list"

        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore"
        )

        print("===== STDOUT =====")
        print(result.stdout)

        output = result.stdout.split()

        custom_objects = [
            obj for obj in output
            if "__c" in obj
        ]

        return jsonify({
            "success": True,
            "objects": custom_objects
        })

    except Exception as e:

        print("ERROR:", str(e))

        return jsonify({
            "success": False,
            "error": str(e)
        })

@app.route("/object/<object_name>", methods=["GET"])
def get_object_details(object_name):

    try:

        command = f"sf force schema sobject describe -s {object_name} --json"

        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore"
        )

        data = json.loads(result.stdout)

        describe = data.get("result", {})

        fields = []

        for field in describe.get("fields", []):

            fields.append({
                "name": field.get("name"),
                "label": field.get("label"),
                "type": field.get("type"),
                "referenceTo": field.get("referenceTo"),
                "relationshipName": field.get("relationshipName")
            
            })
        relationships = []

        for field in describe.get("fields", []):

            if field.get("referenceTo"):

                relationships.append({
                    "field": field.get("name"),
                    "references": field.get("referenceTo")
        })

        response = {
            "objectName": describe.get("name"),
            "label": describe.get("label"),
            "fields": fields,
            "relationships": relationships
        }

        return jsonify({
            "success": True,
            "details": response
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        })

@app.route("/org-relationships", methods=["GET"])
def get_org_relationships():

    try:

        # STEP 1
        # GET ALL OBJECTS

        object_command = "sf force schema sobject list"

        object_result = subprocess.run(
            object_command,
            shell=True,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="ignore"
        )

        all_objects = object_result.stdout.split()

        custom_objects = [
            obj for obj in all_objects
            if "__c" in obj
        ]

        nodes = []
        edges = []

        # STEP 2
        # LOOP OBJECTS

        for obj in custom_objects:

            nodes.append({
                "id": obj,
                "label": obj
            })

            describe_command = (
                f"sf force schema sobject describe "
                f"-s {obj} --json"
            )

            describe_result = subprocess.run(
                describe_command,
                shell=True,
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="ignore"
            )

            try:

                data = json.loads(
                    describe_result.stdout
                )

                describe = data.get("result", {})

                for field in describe.get("fields", []):

                    refs = field.get("referenceTo")

                    if refs:

                        for ref in refs:

                            edges.append({
                                "source": obj,
                                "target": ref,
                                "field": field.get("name"),
                                "relationshipType": field.get("type")
                            })

                            # ADD REFERENCED NODE
                            nodes.append({
                            "id": ref,
                            "label": ref
                            })

            except:
                pass

        return jsonify({
            "success": True,
            "nodes": nodes,
            "edges": edges
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        })

if __name__ == "__main__":

    app.run(debug=True)