"""
Professional PDF Generator for CareerGini
"""
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from typing import Dict, Any, List
import logging

logger = logging.getLogger(__name__)

def generate_pdf(output_path: str, persona: Dict[str, Any]) -> bool:
    """
    Generate a professional PDF resume.
    
    Args:
        output_path: Path to save the PDF
        persona: Dictionary containing candidate data
    """
    try:
        doc = SimpleDocTemplate(
            output_path, 
            pagesize=letter,
            rightMargin=50, leftMargin=50, topMargin=50, bottomMargin=50
        )
        
        styles = getSampleStyleSheet()
        story = []
        
        # --- Custom Styles ---
        styles.add(ParagraphStyle(
            name='HeaderName',
            parent=styles['Heading1'],
            fontSize=24,
            leading=28,
            alignment=TA_CENTER,
            spaceAfter=6,
            textColor=colors.HexColor('#2c3e50')
        ))
        
        styles.add(ParagraphStyle(
            name='HeaderTitle',
            parent=styles['Heading2'],
            fontSize=14,
            leading=18,
            alignment=TA_CENTER,
            spaceAfter=12,
            textColor=colors.HexColor('#7f8c8d')
        ))
        
        styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=styles['Heading3'],
            fontSize=12,
            leading=16,
            spaceBefore=12,
            spaceAfter=6,
            textColor=colors.HexColor('#2c3e50'),
            borderPadding=(0, 0, 5, 0),
            borderColor=colors.HexColor('#bdc3c7'),
            borderWidth=1,
            borderBottom=True
        ))
        
        styles.add(ParagraphStyle(
            name='RoleTitle',
            parent=styles['Normal'],
            fontSize=11,
            leading=14,
            fontName='Helvetica-Bold',
            spaceBefore=6
        ))
        
        styles.add(ParagraphStyle(
            name='CompanyLine',
            parent=styles['Normal'],
            fontSize=10,
            leading=13,
            fontName='Helvetica-Oblique',
            textColor=colors.HexColor('#34495e')
        ))
        
        styles.add(ParagraphStyle(
            name='BulletPoint',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            leftIndent=15,
            bulletIndent=5,
            spaceAfter=2
        ))

        # --- Cover Letter Page ---
        if persona.get("cover_letter"):
            # Cover Letter Header
            name = persona.get("full_name", "Your Name")
            contact_info = []
            if "email" in persona: contact_info.append(persona["email"])
            if "phone" in persona: contact_info.append(persona["phone"])
            
            story.append(Paragraph(name, styles['HeaderName']))
            story.append(Paragraph(" | ".join(contact_info), styles['Normal']))
            story.append(Spacer(1, 40))
            
            # Application Letter Title
            # story.append(Paragraph("Application Letter", styles['Heading2']))
            # story.append(Spacer(1, 20))
            
            # Content
            # Simple text processing to handle newlines
            cl_text = persona["cover_letter"].replace('\n', '<br/>')
            story.append(Paragraph(cl_text, styles['Normal']))
            
            # Force page break
            story.append(PageBreak())

        # --- Header Section ---
        name = persona.get("full_name", "Your Name")
        title = persona.get("professional_title", "Professional Title")
        contact_info = []
        if "email" in persona: contact_info.append(persona["email"])
        if "phone" in persona: contact_info.append(persona["phone"])
        if "location" in persona: contact_info.append(persona["location"])
        
        story.append(Paragraph(name, styles['HeaderName']))
        story.append(Paragraph(title, styles['HeaderTitle']))
        story.append(Paragraph(" | ".join(contact_info), styles['Normal']))
        story.append(Spacer(1, 20))
        
        # --- Summary Section ---
        if persona.get("summary"):
            story.append(Paragraph("PROFESSIONAL SUMMARY", styles['SectionHeader']))
            story.append(Paragraph(persona["summary"], styles['Normal']))
            story.append(Spacer(1, 10))
            
        # --- Skills Section ---
        if persona.get("top_skills"):
            story.append(Paragraph("SKILLS", styles['SectionHeader']))
            # Organize skills into a cleaner comma-separated list
            skills_text = ", ".join(persona["top_skills"])
            story.append(Paragraph(skills_text, styles['Normal']))
            story.append(Spacer(1, 10))
            
        # --- Experience Section ---
        if persona.get("experience_highlights"):
            story.append(Paragraph("WORK EXPERIENCE", styles['SectionHeader']))
            
            for exp in persona["experience_highlights"]:
                role = exp.get("role", "Role")
                company = exp.get("company", "Company")
                duration = exp.get("duration", "Dates")
                
                # Title line: Role | Company | Dates
                # We can use a table for better alignment or just text
                story.append(Paragraph(f"{role}", styles['RoleTitle']))
                story.append(Paragraph(f"{company}  •  {duration}", styles['CompanyLine']))
                
                # Achievements / Description
                if "key_achievement" in exp:
                    achievements = exp["key_achievement"]
                    # If it's a list, add bullets
                    if isinstance(achievements, list):
                        for item in achievements:
                            story.append(Paragraph(f"• {item}", styles['BulletPoint']))
                    else:
                        # Split by semicolon/newline if it's a string
                        items = [i.strip() for i in achievements.replace(';', '\n').split('\n') if i.strip()]
                        for item in items:
                            story.append(Paragraph(f"• {item}", styles['BulletPoint']))
                
                story.append(Spacer(1, 8))
                
        # --- Education Section ---
        if persona.get("education"):
            story.append(Paragraph("EDUCATION", styles['SectionHeader']))
            for edu in persona["education"]:
                degree = edu.get("degree", "")
                school = edu.get("school", "")
                year = edu.get("year", "")
                
                edu_text = f"<b>{degree}</b>, {school}"
                if year:
                    edu_text += f" ({year})"
                story.append(Paragraph(edu_text, styles['Normal']))
                story.append(Spacer(1, 4))

        doc.build(story)
        logger.info(f"PDF generated successfully at {output_path}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to generate PDF: {e}")
        raise
