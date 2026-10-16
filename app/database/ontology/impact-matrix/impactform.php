
<!DOCTYPE html>

<html>
	<head>
		<link rel="stylesheet" type="text/css" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css" integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO" crossorigin="anonymous">
		<link rel="stylesheet" type="text/css" href="files/css/styles.css"/>
		
		<script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
		<script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js" integrity="sha384-ZMP7rVo3mIykV+2+9J3UJ46jBk0WLaUAdn689aCwoqbBJiSnjAK/l8WvCWPIPm49" crossorigin="anonymous"></script>
		<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js" integrity="sha384-ChfqqxuZUCnJSK3+MXmPNIyE6ZbWh2IMqE241rYiqJxyMiZ6OW/JmZQ5stwEULTy" crossorigin="anonymous"></script>
		<script src="files/js/script.js" type="text/javascript"></script>
	</head>
	<body>
		<div class="debug-bar">
			<div class="row">
				<div class="col"><output id="bar-impact">Please Fill Form</output></div>
				<div class="col"><span class="btn btn-primary" onclick="window.print();">Print Impact Analysis</span></div>
				<div class="col"><span class="btn btn-primary" id="clear-page">Clear Page</span></div>
				<div class="col"><span class="btn btn-primary" id="impact-details-btn">Impact Details</span></div>
                <div class="col"><a href="/vpat-analysis/index.php?cmd=signout"><span class="btn btn-dark">Sign out J Hale</span></a></div>
			</div>
		</div>
		
		<div class="extras-bar container vpat-analysis">
			<div class="row headers">
				<div class="col">
					<h4>Ticket Information</h4>
				</div>
			</div>
			<div class="row">
				<div class="col-3 right-aligned">Ticket &num;</div>
				<div class="col-9"><input type="text" id="ticket-info-nonprint" class="full-input required-input"/></div>
			</div>
			<div class="row">
				<div class="col-3 right-aligned">Vendor/Product</div>
				<div class="col-9"><input type="text" id="vendor-info-nonprint" class="full-input required-input"/></div>
			</div>
			<div class="row">
				<div class="col-3 right-aligned">Requesting Dept.</div>
				<div class="col-9"><input type="text" id="requesting-dept-nonprint" class="full-input required-input"/></div>
			</div>
			<div class="row">
				<div class="col-3 right-aligned">Date</div>
				<div class="col-9"><input type="text" disabled="true" id="date-info-nonprint" class="full-input required-input"/></div>
			</div>
		</div>
		
		<div class="container hide hide-non-print" id="access-high-alert">
			<h4 class="center-block">Impact is high and access section is not filled out. Please fill it out to continue!</h4>
		</div>
		
		<div class="container hide hide-non-print" id="pub-mat-high-alert">
			<h4 class="center-block">Impact is high and no publishing materials options are not selected. Please fill it out to continue!</h4>
		</div>
		
		<div class="container hide hide-non-print" id="required-textbox-0">
			<h4 class="center-block">Ticket &num; text box has not been filled in. Please fill it in to continue!</h4>
		</div>
		
		<div class="container hide hide-non-print" id="required-textbox-1">
			<h4 class="center-block">Vendor / Product text box has not been filled in. Please fill it in to continue!</h4>
		</div>
		
		<div class="container hide hide-non-print" id="required-textbox-2">
			<h4 class="center-block">Requesting Department text box has not been filled in. Please fill it in to continue!</h4>
		</div>
		
		<div class="container vpat-analysis">
			<div class="row headers" id="headers">
				<div class="col">
					<h4>Impact</h4>
				</div>
				<div class="col">
					<h4>Low</h4>
				</div>
				<div class="col">
					<h4>Medium</h4>
				</div>
				<div class="col">
					<h4>High</h4>
				</div>
			</div><!--End Headers-->
			
			<!--Intended Audience-->
			<div class="row" id="intended-audience">
				<div class="col">Intended Audience / Users / Groups</div>
				<div class="col">
					<div class="impact-info">Affects Optional Progam/Service</div>
					<label class="selectable">
						<input type="checkbox" class="low ia ia-low users" id="ia-low-users"/>
						<span class="checkmark"></span>
						<span class="text">0-1 Users</span>
					</label><!--users-->
					<label class="selectable">
						<input type="checkbox" class="low ia ia-low pub-facing" id="ia-low-pub-facing"/>
						<span class="checkmark"></span>
						<span class="text">Non Public Facing</span>
					</label><!--pub-facing-->
					<label class="selectable">
						<input type="checkbox" class="low ia ia-low research" id="ia-low-research"/>
						<span class="checkmark"></span>
						<span class="text">Research (Faculty & Small Group of Dedicated Students)</span>
					</label><!--research-->
				</div><!--End Low-->
				
				<div class="col">
					<div class="impact-info">Affects Important but Non-Critical Program/Service</div>
					<label class="selectable">
						<input type="checkbox" class="med ia ia-med users" id="ia-med-users"/>
						<span class="checkmark"></span>
						<span class="text">2-20 Users</span>
					</label><!--users-->
					<label class="selectable">
						<input type="checkbox" class="med ia ia-med num-fac fac-use" id="ia-med-num-staff"/>
						<span class="checkmark"></span>
						<span class="text">Considerable # of Faculty/Staff</span>
					</label><!--num-fac--><!--fac-use-->
					<label class="selectable">
						<input type="checkbox" class="med ia ia-med num-stud stud-use" id="ia-med-num-students"/>
						<span class="checkmark"></span>
						<span class="text">Considerable # of Students</span>
					</label><!--num-stud--><!--stud-use-->
					<label class="selectable">
						<input type="checkbox" class="med ia ia-med pub-facing" id="ia-med-pub-facing"/>
						<span class="checkmark"></span>
						<span class="text">Public Facing Component</span>
					</label><!--pub-facing-->
				</div><!--End Medium-->
				
				<div class="col">
					<div class="impact-info">Affects Critical Program/Service</div>
					<label class="selectable">
						<input type="checkbox" class="high ia ia-high users" id="ia-high-users"/>
						<span class="checkmark"></span>
						<span class="text">21+ Users</span>
					</label><!--users-->
					<label class="selectable">
						<input type="checkbox" class="high ia ia-high num-fac ia-campus-2" id="ia-high-num-staff"/>
						<span class="checkmark"></span>
						<span class="text">All Faculty/Staff</span>
					</label><!--num-fac--><!--ia-campus-2-->
					<label class="selectable">
						<input type="checkbox" class="high ia ia-high num-stud student-use ia-campus-2" id="ia-high-num-students"/>
						<span class="checkmark"></span>
						<span class="text">All Students</span>
					</label><!--num-stud--><!--ia-campus-2-->
					<label class="selectable">
						<input type="checkbox" class="high ia ia-high pub-facing" id="ia-high-pub-facing"/>
						<span class="checkmark"></span>
						<span class="text">Public Facing</span>
					</label><!--pub-facing-->
				</div><!--End High-->
			</div><!--End Intended Audience-->
			
			<!--Access-->
			<div class="row" id="access">
				<div class="col">
					Access
				</div>
				
				<div class="col">
					<label class="selectable">
						<input type="checkbox" class="low ac ac-low" id="ac-low-limits"/>
						<span class="checkmark"></span>
						<span class="text"><u>Does Not Limit Access:</u><br/>
						To Program/Service for People with Disabilities</span>
					</label>
				</div><!--End Low-->
				
				<div class="col">
					<label class="selectable">
						<input type="checkbox" class="med ac ac-med" id="ac-med-limits"/>
						<span class="checkmark"></span>
						<span class="text"><u>Limits Access:</u><br/>
						To Program/Service for People with Disabilities</span>
					</label>
				</div><!--End Medium-->
				
				<div class="col">
					<label class="selectable">
						<input type="checkbox" class="high ac ac-high" id="ac-high-limits"/>
						<span class="checkmark"></span>
						<span class="text"><u>Denies Access:</u><br/>
						To Program/Service for People with Disabilities</span>
					</label>
				</div><!--End High-->
			</div>
			
			<!--Legal Exposure-->
			<div class="row" id="legal-exposure">
				<div class="col">Legal Exposure</div>
				
				<div class="col">
					<div class="impact-info">Little to None</div>
					<label class="selectable">
						<input type="checkbox" class="low le le-low student-use leg-exp" id="le-low-student-use"/>
						<span class="checkmark"></span>
						<span class="text">No to Low Student User</span>
					</label><!--student-use-->
					<label class="selectable">
						<input type="checkbox" class="low le le-low leg-exp" id="le-low-optional"/>
						<span class="checkmark"></span>
						<span class="text">Use of Product is Optional</span>
					</label>
					<label class="selectable">
						<input type="checkbox" class="low le le-low acad-use" id="le-low-req"/>
						<span class="checkmark"></span>
						<span class="text">Not Required for Academic or Employment Purposes</span>
					</label><!--acad-use-->
				</div><!--End Low-->
				
				<div class="col">
					<div class="impact-info">Moderate Exposure</div>
					<label class="selectable">
						<input type="checkbox" class="med le le-med student-use stud-use leg-exp campus-2" id="le-med-student-use"/>
						<span class="checkmark"></span>
						<span class="text">Student Use</span>
					</label><!--student-use--><!--stud-use-->
					<label class="selectable">
						<input type="checkbox" class="med le le-med fac-use leg-exp" id="le-med-optional"/>
						<span class="checkmark"></span>
						<span class="text">Moderate Faculty/Staff Use (Non-Identified Personnel)</span>
					</label><!--fac-use-->
					<label class="selectable">
						<input type="checkbox" class="med le le-med acad-use leg-exp" id="le-med-req-students"/>
						<span class="checkmark"></span>
						<span class="text">Consideration for Required Academic Purposes (if requirement timeline is short & student users are low)</span>
					</label><!--acad-use-->
					<label class="selectable">
						<input type="checkbox" class="med le le-med acad-emp-req acad-use leg-exp" id="le-med-req-employment"/>
						<span class="checkmark"></span>
						<span class="text">Required for Employment Purposes</span>
					</label><!--acad-use-->
				</div><!--End Medium-->
				
				<div class="col">
					<div class="impact-info">Significant Exposure</div>
					<label class="selectable">
						<input type="checkbox" class="high le le-high campus scope-dept leg-exp" id="le-high-student-use"/>
						<span class="checkmark"></span>
						<span class="text">Campus-Wide</span>
					</label>
					<label class="selectable">
						<input type="checkbox" class="high le le-high student-use campus-2 leg-exp" id="le-high-optional-student"/>
						<span class="checkmark"></span>
						<span class="text">All Student Access</span>
					</label><!--student-use-->
					<label class="selectable">
						<input type="checkbox" class="high le le-high campus-2 leg-exp" id="le-high-optional-faculty"/>
						<span class="checkmark"></span>
						<span class="text">All Faculty/Staff Access</span>
					</label>
					<label class="selectable">
						<input type="checkbox" class="high le le-high pub-facing leg-exp" id="le-high-pub-facing"/>
						<span class="checkmark"></span>
						<span class="text">Public Facing</span>
					</label><!--pub-facing-->
					<label class="selectable">
						<input type="checkbox" class="high le le-high acad-emp-req acad-use research-pa leg-exp" id="le-high-req-acad"/>
						<span class="checkmark"></span>
						<span class="text">Required for Academic Purposes</span>
					</label><!--research-pa-->
				</div><!--End High-->
			</div><!--End Legal Exposure-->
			
			<!--Use-->
			<div class="row" id="use">
				<div class="col">Use</div>
				
				<div class="col">
					<label class="selectable">
						<input type="checkbox" class="low u u-low" id="u-low-purchase"/>
						<span class="checkmark"></span>
						<span class="text">Single Purchase or Annual Renewal Without Scope Change</span>
					</label>
					<label class="selectable">
						<input type="checkbox" class="low u u-low pub-mat" id="u-low-publish"/>
						<span class="checkmark"></span>
						<span class="text">Does Not Publish Materials</span>
					</label><!--pub-mat-->
					<label class="selectable">
						<input type="checkbox" class="low u u-low roll-out" id="u-low-purchase"/>
						<span class="checkmark"></span>
						<span class="text">Not Rolled Out At All</span>
					</label><!--roll-out-->
				</div><!--End Low-->
				
				<div class="col">
					<label class="selectable">
						<input type="checkbox" class="med u u-med pub-mat" id="u-med-publish"/>
						<span class="checkmark"></span>
						<span class="text">May Publish Materials Used by Specific (Limited) Audiences</span>
					</label><!--pub-mat-->
					<label class="selectable">
						<input type="checkbox" class="med u u-med roll-out" id="u-med-purchase"/>
						<span class="checkmark"></span>
						<span class="text">Product May Be Rolled Out to Larger Audience</span>
					</label><!--roll-out-->
				</div><!--End Medium-->
				
				<div class="col">
					<label class="selectable">
						<input type="checkbox" class="high u u-high pub-mat" id="u-high-publish"/>
						<span class="checkmark"></span>
						<span class="text">Publishes Public Facing Materials</span>
					</label><!--pub-mat-->
					<label class="selectable">
						<input type="checkbox" class="high u u-high roll-out" id="u-high-purchase"/>
						<span class="checkmark"></span>
						<span class="text">Product Will be Rolled Out to Large Audience or Campus Wide</span>
					</label><!--roll-out-->
				</div><!--End High-->
			</div><!--End Use-->
			
			<!--Areas or Location of Use-->
			<div class="row" id="location-use">
				<div class="col">Areas or Location of Use</div>
				
				<div class="col">
					<label class="selectable">
						<input type="checkbox" class="low lu lu-low dept scope-dept" id="lu-low-department"/>
						<span class="checkmark"></span>
						<span class="text">1 Department, Organization, or Course (1 Time Instruction)</span>
					</label><!--dept-->
					<label class="selectable">
						<input type="checkbox" class="low lu lu-low pub-facing" id="lu-low-public"/>
						<span class="checkmark"></span>
						<span class="text">Non-Public (Office or Restricted Area)</span>
					</label><!--pub-facing-->
					<label class="selectable">
						<input type="checkbox" class="low lu lu-low research" id="lu-low-research"/>
						<span class="checkmark"></span>
						<span class="text">Research</span>
					</label><!--research-->
				</div><!--End Low-->
				
				<div class="col">
					<label class="selectable">
						<input type="checkbox" class="med lu lu-med" id="lu-med-public"/>
						<span class="checkmark"></span>
						<span class="text">Classroom, Lab</span>
					</label>
					<label class="selectable">
						<input type="checkbox" class="med lu lu-med dept scope-dept" id="lu-med-department"/>
						<span class="checkmark"></span>
						<span class="text">Multiple Departments, Organizations, or Courses</span>
					</label><!--dept-->
					<label class="selectable">
						<input type="checkbox" class="med lu lu-med pub-facing" id="lu-med-public-space"/>
						<span class="checkmark"></span>
						<span class="text">Semi-Public (Service Offices, Public Space)</span>
					</label><!--pub-facing-->
				</div><!--End Medium-->
				
				<div class="col">
					<label class="selectable">
						<input type="checkbox" class="high lu lu-high campus scope-dept" id="lu-high-public"/>
						<span class="checkmark"></span>
						<span class="text">Campus-Wide</span>
					</label>
					<label class="selectable">
						<input type="checkbox" class="high lu lu-high dept" id="lu-high-department"/>
						<span class="checkmark"></span>
						<span class="text">Specific Courses (All Sections, Part of Curriculum)</span>
					</label><!--dept-->
					<label class="selectable">
						<input type="checkbox" class="high lu lu-high pub-facing" id="lu-high-public-space"/>
						<span class="checkmark"></span>
						<span class="text">Public (Lab e.g. Learning Commons / Classroom / Public Space)</span>
					</label><!--pub-facing-->
				</div><!--End High-->
			</div><!--End Areas or Location of Use-->
		</div>
		
		<div class="container vpat-analysis" id="further-details">
			<div id="fd-users">
				<hr/>
				If there are 21+ users, please confirm how much.
				<select id="fd-users-sel">
					<option>Not Sure</option>
					<option>21-100</option>
					<option>100+</option>
				</select>
			</div>
		</div>
		
		<div class="extras-bar container vpat-analysis hide-non-print" id="print-ticket-info">
			<div class="row headers">
				<div class="col">
					<h4>Ticket Information</h4>
				</div>
			</div>
			<div class="row">
				<div class="col-3 right-aligned">Ticket &num;</div>
				<div class="col-9"><input type="text" id="ticket-info-print" class="full-input"/></div>
			</div>
			<div class="row">
				<div class="col-3 right-aligned">Vendor/Product</div>
				<div class="col-9"><input type="text" id="vendor-info-print" class="full-input"/></div>
			</div>
			<div class="row">
				<div class="col-3 right-aligned">Requesting Dept.</div>
				<div class="col-9"><input type="text" id="requesting-dept-print" class="full-input"/></div>
			</div>
			<div class="row">
				<div class="col-3 right-aligned">Date</div>
				<div class="col-9"><input type="text" id="date-info-print" class="full-input"/></div>
			</div>
		</div>
		
		<div class="container vpat-analysis" id="print-impact-matrix">
			<div class="row">
				<h4 class="col">Impact</h4>
				<h4 class="col">Current</h4>
				<h4 class="col">Low</h4>
				<h4 class="col">Medium</h4>
				<h4 class="col">High</h4>
			</div>
			
			<!--
				=== AUDIENCE AND USERS ===
			-->
			<div class="row" id="row-audience" data="0">
				<div class="col">Audience / # of Users</div>
				
				<div class="col" id="curr-audience">
					Unknown amount of users
				</div>
				
				<div class="col" id="low-audience">
					Affects optional program / service
				</div>
				
				<div class="col" id="med-audience">
					Affects important but non-critical program / service
				</div>
				
				<div class="col" id="high-audience">
					Affects critical program / service
				</div>
			</div>
			
			<!--
				=== ACCESS ===
			-->
			<div class="row" id="row-access" data="0">
				<div class="col">Access</div>
				
				<div class="col" id="curr-access">
					Does not limit access
				</div>
				
				<div class="col" id="low-access">
					Does not limit access to program / service for people
					with disabilities.
				</div>
				
				<div class="col" id="med-access">
					Limits access to a program / service for people with
					disabilities.
				</div>
				
				<div class="col" id="high-access">
					Denies access to a program / service for people with
					disabilities.
				</div>
			</div>
			
			<!--
				=== LEGAL EXPOSURE ===
			-->
			<div class="row" id="row-legal-exposure" data="0">
				<div class="col">Legal Exposure</div>
				
				<div class="col" id="curr-legal-exposure">
					Unknown Legal Exposure
				</div>
				
				<div class="col" id="low-legal-exposure">
					Little to none.
					<ul>
						<li>Smaller audience groups</li>
						<li>Optional Use</li>
					</ul>
				</div>
				
				<div class="col" id="med-legal-exposure">
					Moderate Exposure.
					<ul>
						<li>Mid-size audience groups</li>
						<li>Is its use optional or required?</li>
					</ul>
				</div>
				
				<div class="col" id="high-legal-exposure">
					Significant Exposure.
					<ul>
						<li>Public facing or any "all" audience categories</li>
					</ul>
				</div>
			</div>
			
			<!--
				=== SCOPE ===
			-->
			<div class="row" id="row-scope" data="0">
				<div class="col">Scope</div>
				
				<div class="col" id="curr-scope">
					Unknown use of departments
				</div>
				
				<div class="col" id="low-scope">
					1 department, organization, or course
				</div>
				
				<div class="col" id="med-scope">
					Multiple departments, organizations, or courses
				</div>
				
				<div class="col" id="high-scope">
					Campus-wide
				</div>
			</div>
			
			<!--
				=== LOCATION ===
			-->
			<div class="row" id="row-location" data="0">
				<div class="col">Location</div>
				
				<div class="col" id="curr-location">
					Unknown location of use
				</div>
				
				<div class="col" id="low-location">
					Non-public (office)
				</div>
				
				<div class="col" id="med-location">
					Semi-public (service offices, public space)
				</div>
				
				<div class="col" id="high-location">
					Public (lab / classroom / public space)
				</div>
			</div>
		</div>
		
		<div class="modal fade" id="impact-details" tabindex="-1" role="dialog">
			<div class="modal-dialog" role="document">
				<div class="modal-content">
					<div class="modal-header">
						<div class="modal-title">Impact Details</div>
						<button type="button" class="close" data-dismiss="modal" aria-label="Close">
							<span aria-hidden="true">&times;</span>
						</button>
					</div>
					
					<div class="modal-body">
						<div class="details">No Details</div>
					</div>
					
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
					</div>
				</div>
			</div>
		</div>
		
		<div class="container vpat-analysis" id="print-impact-level">
			<hr/>
			<div class="row">
				<div class="col">
					Impact Level: <span id="impact-level">Unknown</span>
				</div>
				<div class="col" id="impact-level-info"></div>
			</div>
		</div>
		
		<div class="container vpat-analysis" id="print-impact-details">
			<hr/>
			<div class="header">Remarks</div>
			<div class="details">No Details</div>
		</div>
		
	</body>
</html>