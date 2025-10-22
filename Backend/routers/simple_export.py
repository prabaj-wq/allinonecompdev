from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
import io
import csv
import json
from datetime import datetime, date
from decimal import Decimal
from company_database import company_connection
import psycopg2.extras

router = APIRouter(prefix="/simple-export", tags=["simple-export"])

@router.get("/entity_amounts")
async def export_entity_amounts_simple(
    company_name: str = Query(...),
    process_id: str = Query(...),
    scenario_id: str = Query(None)
):
    """Simple CSV export for entity amounts - just export what's visible"""
    try:
        print(f"🚀 Simple export request: process_id={process_id}, scenario_id={scenario_id}")
        
        with company_connection(company_name) as conn:
            cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            
            # Get process name for table
            cur.execute("SELECT name FROM financial_processes WHERE id = %s", (process_id,))
            process_result = cur.fetchone()
            if not process_result:
                raise HTTPException(status_code=404, detail="Process not found")
            
            # Create table name
            safe_process_name = process_result['name'].lower().replace(' ', '_').replace('-', '_')
            table_name = f"{safe_process_name}_entity_amounts_entries"
            
            print(f"📋 Exporting from table: {table_name}")
            
            # Build simple query
            where_conditions = ["process_id = %s"]
            params = [process_id]
            
            if scenario_id:
                where_conditions.append("(scenario_id = %s OR scenario_id IS NULL)")
                params.append(scenario_id)
            
            where_clause = " AND ".join(where_conditions)
            
            query = f"""
                SELECT 
                    entity_code, entity_name, account_code, account_name,
                    period_code, period_name, fiscal_year, fiscal_month,
                    transaction_date, amount, currency, scenario_id,
                    description, reference_id, created_at
                FROM {table_name}
                WHERE {where_clause}
                ORDER BY created_at DESC
            """
            
            print(f"📄 Export query: {query}")
            print(f"📄 Export params: {params}")
            
            cur.execute(query, params)
            rows = cur.fetchall()
            
            print(f"✅ Retrieved {len(rows)} rows for export")
            
            # Create CSV
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Write headers
            headers = [
                'Entity Code', 'Entity Name', 'Account Code', 'Account Name',
                'Period Code', 'Period Name', 'Fiscal Year', 'Fiscal Month',
                'Transaction Date', 'Amount', 'Currency', 'Scenario ID',
                'Description', 'Reference ID', 'Created At'
            ]
            writer.writerow(headers)
            
            # Write data
            for row in rows:
                row_data = []
                for field in [
                    'entity_code', 'entity_name', 'account_code', 'account_name',
                    'period_code', 'period_name', 'fiscal_year', 'fiscal_month',
                    'transaction_date', 'amount', 'currency', 'scenario_id',
                    'description', 'reference_id', 'created_at'
                ]:
                    value = row.get(field, '')
                    if value is None:
                        value = ''
                    elif isinstance(value, (datetime, date)):
                        value = value.isoformat()
                    elif isinstance(value, Decimal):
                        value = float(value)
                    row_data.append(str(value))
                writer.writerow(row_data)
            
            # Prepare response
            output.seek(0)
            csv_content = output.getvalue()
            output.close()
            
            # Create filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"entity_amounts_export_{timestamp}.csv"
            
            print(f"✅ Export completed: {len(rows)} rows, filename: {filename}")
            
            return StreamingResponse(
                io.StringIO(csv_content),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )
            
    except Exception as e:
        print(f"❌ Export error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")
