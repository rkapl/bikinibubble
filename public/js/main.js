var bikini={
	state:"page1",
  pages : ["page1", "pagePaths", "pageFaces", "pageTune"],
	image: null,
	pointRadius:4,
	imageSize:{width:0,height:0},
	canvasSize:{width:0,height:0},
	browserErrorText:null,
	paths:[
	],
  faces:[
  ],
	circleCache:[],
	computation:{
		circles:[],
		running:false,
		tasksDone:0,
		tasksTotal:0,
		nextTask: {firstPass:true, i:0}
	},
	coverColor:"#E300A9",
	circlesCount:100,
	maxCircleSize:100,
	bubbleMargin:10,
	bubbleShapeMargin:1,
	maxCircles:400,
	pickedPoint:null,
	currentPath:null,
  currentFace:null,
  shouldSetFaceSize: true,
	shouldStarNewPath:true,
	files:null,
	context:null,
	browserError:function(){
		alert(this.browserErrorText);
	},
  hideAll:function(){
    $('#page-get-photo').hide();
    $('#page1-toolbar').hide();
		$('#paths-toolbar').hide();
		$('#tuning-toolbar').hide();
		$('#page-canvas').hide();
		$('#bottom-bar').hide();
		$('#page-example').hide();
    $('#face-toolbar').hide();
  },
	page1:function(){
		bikini.toggleMenu(0);
    this.hideAll();
		$('#page-get-photo').show();
    $('#page1-toolbar').show();
		this.state="page1";
	},
	dataReady:function(){
		this.files=$('#upload-field').get(0).files;
		if(this.files.length!=0){
			return true;
		}else if(!$('#url-field').val()==""){
			return true;
		}
		return false
	},
	pagePaths:function(force){
		if(!this.dataReady()){
			alert('Select the photo');
			return;
		}
		bikini.toggleMenu(1);
		this.state="pagePaths";
		this.loadImage(force);
    this.hideAll();
		$('#paths-toolbar').show();
		$('#page-canvas').show();
	},
	loadImage:function(force){
		if(this.image!=null && !force){
			this.redraw();
			return;
		}
		this.image=new Image();
		var file=bikini.files[0];
		var t=this;
		this.image.onload=function () {
			//we draw into square
			var w=t.image.width;
			var h=t.image.height;
			if(w/h<1){
				t.imageSize.height=t.canvasSize.height;
				t.imageSize.width=t.canvasSize.height/h*w;
			}else{
				t.imageSize.width=t.canvasSize.width;
				t.imageSize.height=t.canvasSize.width/w*h;
			}
			t.redraw();
		};
		if (typeof FileReader !== "undefined" && file!=undefined && file.type.indexOf("image") != -1) {
			var reader = new FileReader();
			// Note: addEventListener doesn't work in Google Chrome for this event
			reader.onload = function (evt) {
				bikini.image.src = evt.target.result;
			};
			reader.readAsDataURL(file);
		}else if(!$('#url-field').val()==""){
			var v=$('#url-field').val();
			if(v.indexOf('http://')!=0) v="http://"+v;
			this.image.src=v;
		}
	},
  pageFaces:function(){
    if(!this.dataReady()){
			alert('Select the photo');
			return;
		}
    this.state="pageFaces";
    this.loadImage(false);
		bikini.toggleMenu(2);
    this.hideAll();
    $('#face-toolbar').show();
		$('#page-canvas').show();
  },
	pageTune:function(){
		if(!this.dataReady()){
			alert('Select the photo');
			return;
		}
		this.state="pageTune";
		this.loadImage(false);
		bikini.toggleMenu(3);
    this.hideAll();
    $('#tuning-toolbar').show();
		$('#page-canvas').show()
		$('#bottom-bar').show();
		
		$('#page-example').hide();
    this.computeCircles();
    this.redraw();
	},
	example:function(){
		$('#bottom-bar').hide();
		$('#page-get-photo').hide();
		$('#paths-toolbar').hide();
		$('#tuning-toolbar').hide();
		$('#page-canvas').hide();
		$('#page-example').show();
    $('#face-toolbar').hide();
	},
	toggleMenu:function(i){
		$('#left-menu li').removeClass('selected');
		$($('#left-menu li').get(i)).addClass('selected');
	},
	drawPath:function(p,context){
		var points=p.points;
		context.beginPath();
		context.moveTo(points[0].x,points[0].y);
		for(var j=1;j<=points.length;j++){
			var point=points[j%points.length];
			//alert(point.x);
			context.lineTo(point.x,point.y);
		}
	},
	pick:function(x,y){
		for(var i=0;i<this.paths.length;i++){
			var path=this.paths[i];
			for(var j=0;j<path.points.length;j++){
				var point=path.points[j];
				if(Math.abs(point.x-x)<=this.pointRadius &&
					Math.abs(point.y-y)<=this.pointRadius){
					return {path:path,point:point};
				}
				}
			}
		return null;
	},
  pickFace:function(x,y){
    for(var i=0;i<this.faces.length;i++){
      var d=this.faces[i];
      var dx = x-d[0];
      var dy = y-d[1];
      if(dx*dx + dy*dy <= d[2]*d[2]) return d;
    }
    return null;
  },
	point:function(e){
		var canvas=$("#canvas").get(0);
		var x=e.pageX-canvas.offsetLeft;
		var y=e.pageY-canvas.offsetTop;
    if(this.state == 'pagePaths'){
  		var pick=this.pick(x,y);
  		if(pick==null){
  			this.pickedPoint=null;
  			if(this.shouldStartNewPath || this.currentPath==null){
  				this.shouldStartNewPath=false;
  				$('#path-add img').attr("src","img/add-icon.png");
  				var p={points:[]};
  				this.currentPath=p;
  				this.paths.push(p);
  			}
  			var path=this.currentPath;
  			path.points.push({x:x,y:y});
  		}else{
  			this.currentPath=pick.path;
  			this.pickedPoint=pick.point;
  		}
  		this.redraw();
    }else if(this.state == 'pageFaces'){
      var pick = this.pickFace(x,y);
      if(pick==null){
        this.currentFace = [x,y, 10];
        this.shouldSetFaceSize = true;
        this.faces.push(this.currentFace);
      }else{
        this.currentFace = pick;
        this.shouldSetFaceSize = false;
      }
      this.redraw();
    }
	},
	move:function(e){
		var canvas=$("#canvas").get(0);
		var x=e.pageX-canvas.offsetLeft;
		var y=e.pageY-canvas.offsetTop;
    if(this.state == 'pagePaths'){
  		if(this.pickedPoint!=null){
  			this.pickedPoint.x=x;
  			this.pickedPoint.y=y;
  		}
		  this.redraw();
    }else if(this.state == 'pageFaces'){
      if(this.currentFace != null && this.shouldSetFaceSize){
        var dx = this.currentFace[0] - x;
        var dy = this.currentFace[1] - y;                                    
        this.currentFace[2] = Math.max(10, Math.sqrt(dx*dx+ dy*dy));
        this.redraw();
      }
    }                           
	},
  deleteFaces:function(){
    this.faces = [];
    this.currentFaces = null;
    this.shouldSetFaceSize = false;
		this.redraw();
	},
	deletePaths:function(){
    this.paths = [];
    this.currentPath = null;
    this.pickedPath = null;
		this.redraw();
	},
	computeCircles:function(){
		/*algorithm:
		 * go throught alll positions in picture and find the largest circle
		 * that can be placed at that point, based on the constraints 
		 * (it may not intersect the clothing lines, but it can be within).
		 * The bubbles inside clothin will be covered during rendering.
		 * We choose tha largest circle and run the alorithm again, with a
		 * new constraint: the circles may not intersect the circles we chose.
		 * Run it until we obtain the needed number of circles.
		 */
    var bmargin=this.bubbleMargin;
		var w=this.canvasSize.width;
		var h=this.canvasSize.height;
		this.circleCache=[];
		var self=this;
		this.computation.running=true;
		this.computation.circles=[];
		this.computation.nextTask.firstPass=true;
		this.computation.nextTask.i=0;
		this.computation.tasksDone=0;
    this.computation.forcedCircles = [];
    //add faces as pre-defined circles
    for(var i=0; i<this.faces.length;i++){
      var f = this.faces[i];
      this.computation.forcedCircles.push(f);
      this.circleCache.push({x:f[0], y:f[1], r:f[2]});
    }
    
		//first pass+second pass
		this.computation.tasksTotal=this.maxCircles+this.canvasSize.height+this.bubbleMargin*2;
		window.setTimeout(function(){self.stepComputation();},0);
	},
	stepComputation:function(){
		var bmargin=this.bubbleMargin;
		var w=this.canvasSize.width;
		var h=this.canvasSize.height;
		var comp=this.computation;
		var done=false;
		//the biggest circle found
		if(comp.nextTask.firstPass){//go throught all rows
			comp.winner=null;
			var y=comp.nextTask.i-bmargin;
			for(var x=-bmargin;x<w+bmargin;x++){
				var circle={x:x,y:y,r:this.maxCircleSize};
				for(var i=0;i<this.paths.length;i++){
					var points=this.paths[i].points;
					for(var j=0;j<points.length;j++){
						//collision of this line with our circle
						//find point closest to our center (x,y)
						var a=points[j];
						var b=points[(j+1)%points.length];
						var px=x;
						var py=y;
						var apx=px-a.x;
						var apy=py-a.y;
						var abx=b.x-a.x;
						var aby=b.y-a.y;
						//squared length
						var ab2= abx*abx+aby*aby;
						//dot product
						var ap_ab= apx*abx + apy*aby;
						var t = ap_ab / ab2;      
						if (t < 0.0) t = 0.0;
						else if (t > 1.0) t = 1.0;
						var resultx= a.x+t*abx;
						var resulty= a.y+t*aby;
						var distVecx= px-resultx;
						var distVecy= py-resulty;
						var distance=Math.sqrt(distVecx*distVecx+distVecy*distVecy);
						if(circle.r>distance) circle.r=distance;
					}
				}
        for(var k=0; k<comp.forcedCircles.length; k++){
          var fc =  comp.forcedCircles[k];
          var dx = circle.x - fc[0]
          var dy = circle.y - fc[1];
          var d = Math.sqrt(dx*dx+dy*dy);
          if(circle.r + fc[2] > d) circle.r = d - fc[2]; 
        }
        var idx=(y+bmargin)*(w+bmargin*2)+x+bmargin;
        if(comp.circles[idx]==null)
				  comp.circles[idx] = circle;
				if(comp.winner==null || comp.winner.r<circle.r) comp.winner=circle;
			}
			if(++comp.nextTask.i>=h+bmargin*2){
				comp.nextTask.i=0;
				comp.nextTask.firstPass=false;
				comp.winner.fixed=true;
				this.circleCache.push(comp.winner);		
			}
		}else{
			var lastWinner=comp.winner;
			comp.winner=null;
			for(var y=-bmargin;y<h+bmargin;y++){
				for(var x=-bmargin;x<w+bmargin;x++){
					var circle=comp.circles[(y+bmargin)*(w+bmargin*2)+x+bmargin];
					if(circle.fixed) continue;
					//if(circle==undefined) alert("circle not found "+x+":"+y);
					var distx=circle.x-lastWinner.x;
					var disty=circle.y-lastWinner.y;
					var dist=Math.sqrt(distx*distx+disty*disty)-lastWinner.r;
					if(circle.r>dist){
						circle.r=dist;
					}
					//speedup
					if(circle.r<=0) circle.fixed=true;
					if(comp.winner==null || comp.winner.r<circle.r)
						comp.winner=circle;
				}
			}
			comp.winner.fixed=true;
			this.circleCache.push(comp.winner);
			if(++comp.nextTask.i>=this.maxCircles){
				done=true;
			}
		}
		comp.tasksDone++;
		if(!comp.nextTask.firstPass && comp.tasksDone%10==0){
			//show progress visually
			this.redraw();
		}
		var progress=(comp.tasksDone)/comp.tasksTotal;
		$('#progress').progressbar("option","value",parseInt(progress*100));
		if(!done){
			var self=this;
			window.setTimeout(function(){self.stepComputation();},0);
		}else{
			this.computation.running=false;
			this.redraw();
			//alert("finished");
		}
		return done;
	},
	redraw:function(){
		this.renderTo(this.context);
	},
	renderTo:function(context){
		var px=this.canvasSize.width/2-this.imageSize.width/2;
		var py=this.canvasSize.height/2-this.imageSize.height/2;
		if(this.state=="pagePaths"){
			this.context.fillStyle = "black";
			this.context.fillRect(0,0,this.canvasSize.width,this.canvasSize.height);
			this.context.globalCompositeOperation="source-over";
			this.context.drawImage(this.image,px,py,this.imageSize.width,this.imageSize.height);
			for(var i=0;i<this.paths.length;i++){
				var path=this.paths[i];
				this.drawPath(path,context);
				if(path!=this.currentPath)
					this.context.fillStyle = "rgba(204,24,200,0.3)";
				else
					this.context.fillStyle = "rgba(204,24,200,0.6)";
				this.context.fill();
				this.drawPath(path,context);
				this.context.strokeStyle = "rgb(74,18,73)";
				this.context.lineWidth=2;
				this.context.stroke();
				this.context.fillStyle = "black";
				for(var j=0;j<path.points.length;j++){
					var point=path.points[j];
					this.context.fillRect(point.x-this.pointRadius,point.y-this.pointRadius,
							this.pointRadius*2,this.pointRadius*2);
				}
			}
    }else if(this.state=="pageFaces"){
      this.context.fillStyle = "black";
      this.context.fillRect(0,0,this.canvasSize.width,this.canvasSize.height);
			this.context.globalCompositeOperation="source-over";
			this.context.drawImage(this.image,px,py,this.imageSize.width,this.imageSize.height);
			for(var i=0;i<this.faces.length;i++){
         var face = this.faces[i];
        if(this.currentFace != face) 
            this.context.fillStyle = "rgba(204,24,200,0.5)";
  			else
  					this.context.fillStyle = "rgba(204,24,200,0.8)";
        this.context.beginPath();
        this.context.arc(face[0], face[1], face[2], 0, Math.PI * 2, false);
        this.context.fill();
      }
		}else if(this.state=="pageTune"){
			context.globalCompositeOperation="source-over";
			context.fillStyle = this.coverColor;
			context.fillRect(0,0,this.canvasSize.width,this.canvasSize.height);
			var circlesToDraw=Math.min(this.circleCache.length,this.circlesCount);
			for(var i=0;i<circlesToDraw;i++){
				var circle=this.circleCache[i];
				context.globalCompositeOperation="destination-out";
				context.fillStyle = "black";
				var r=circle.r-this.bubbleShapeMargin;
				if(r>0){
					context.beginPath();
					context.arc(circle.x, circle.y, r, 0, Math.PI*2, true); 
					context.closePath();
					context.fill();
				}
			}
			//fill the holes with the image
			context.globalCompositeOperation="destination-atop";
			context.drawImage(this.image,px,py,this.imageSize.width,this.imageSize.height);
			//cover up the insides
			context.globalCompositeOperation="source-over";
			for(var i=0;i<this.paths.length;i++){
				var path=this.paths[i];
				this.drawPath(path,context);
				context.fillStyle = this.coverColor;
				context.fill();
			}
		}
	},
	renderToHidden:function(){
		var hiddenCanvas=$('#hidden-canvas').get(0);
		hiddenCanvas.width=this.image.width;
		hiddenCanvas.height=this.image.height;
		var context=hiddenCanvas.getContext('2d');
		context.save();
		//transform it full-size
		var px=this.canvasSize.width/2-this.imageSize.width/2;
		var py=this.canvasSize.height/2-this.imageSize.height/2;
		var scale=0;
		if(this.image.width>this.image.height){
			scale=this.image.width/this.canvasSize.width;
		}else{
			scale=this.image.height/this.canvasSize.height;
		}
		//alert(scale);
		context.scale(scale,scale);
		context.translate(-px,-py);
		this.renderTo(context);
		context.restore();
	}
};
$(document).ready(function(){
	bikini.browserErrorText=$('#canvas').html();
	bikini.files=$('#upload-field').get(0).files;
	if(bikini.files==undefined) bikini.browserError();
	var canvas=$('#canvas').get(0);
	canvas.width=$('#work-area').width();
	canvas.height=$('#work-area').height();
	var hiddenCanvas=$("#hidden-canvas").get(0);
	bikini.canvasSize={width:canvas.width, height: canvas.height };
	if(canvas.getContext==undefined) bikini.browserError();
	if(typeof FileReader === "undefined") bikini.browserError(); 
	bikini.context=canvas.getContext('2d');
	$('#upload-field').change(function(){
		bikini.pagePaths(true);
	});
	$('#try-more').button().click(function(){
	   window.location="http://gay-porn.cz"
  });
	$('#i-dont-get-it').button();
	var wasBeforeAfter=false
	$('#i-dont-get-it').click(function(){
		bikini.example();
		if(!wasBeforeAfter){
			$('#container').beforeAfter({
				showFullLinks:false,
				imagePath:'./img/',
				animateIntro : true,
		        introDelay : 100,
		        introDuration : 1000,
			});
			wasBeforeAfter=true;
		}
	});
	$('#ive-got-it').button().click(function(){
		bikini.page1();
	});
	$('#left-menu li').each(function(i){
		$(this).click(function(e){
			e.preventDefault();
			bikini[bikini.pages[i]]();
		});
	});
	$('#canvas').mousedown(function(e){
	    bikini.point(e);
	});
	$('#canvas').mousemove(function(e){
			bikini.move(e);
  });
	$('#canvas').mouseup(function(e){
			bikini.pickedPoint=null;
      bikini.shouldSetFaceSize=false;
	});
	$('#path-add').click(function(e){
		e.preventDefault();
		$('#path-add img').attr("src","img/add-icon-active.png");
		bikini.shouldStartNewPath=true;
	});
	$('#path-remove').click(function(e){
		e.preventDefault();
		bikini.deletePaths();
	});
  $('#face-remove').click(function(e){
		e.preventDefault();
		bikini.deleteFaces();
	});
	$('#redraw').click(function(e){bikini.redraw();e.preventDefault()});
	$('#next').button().click(function(e){
		bikini.pageFaces();
	});
  $('#next2').button().click(function(e){
		bikini.pageTune();
	});
	$('#color-picker').farbtastic(function(color){
		//alert(color);
		bikini.coverColor=color;
		bikini.redraw();
	});
	$.farbtastic('#color-picker').setColor(bikini.coverColor);
	$('#progress').progressbar({value:50});
	$('#circles-slider').slider({
		min:10,
		max:bikini.maxCircles,
		step: 1,
		value: bikini.circlesCount,
		change: function(event, ui) {
			bikini.circlesCount=ui.value;
			bikini.redraw();
		}
	});
	$('#padding-slider').slider({
		min:0,
		max:30,
		step: 1,
		value: bikini.bubbleShapeMargin,
		change: function(event, ui) {
			bikini.bubbleShapeMargin=ui.value;
			bikini.redraw();
		}
	});
	$('#max-size-slider').slider({
		min:10,
		max:300,
		step: 1,
		value: bikini.maxCircleSize,
		change: function(event, ui) {
			bikini.maxCircleSize=ui.value;
      bikini.computeCircles();
			bikini.redraw();
		}
	});
	$('#button-download').button({});
	$('#button-download').click(function(){
			bikini.renderToHidden();
			var url=hiddenCanvas.toDataURL("image/jpeg",0.95);
			window.open(url, "download");
		});
	$('#button-facebook').button({});
	$('#button-facebook').click(function(){
    var handleLogin = function(response){
      if (response.authResponse && response.authResponse.accessToken) {
		    var token=response.authResponse.accessToken;
		    bikini.renderToHidden();
			var url=hiddenCanvas.toDataURL("image/jpeg",90);
			$.blockUI();
		    $.post('fb_handler.php',
	            {
	                img : url
	            },
	            function(data) {
	            	$.unblockUI();
	            	alert('The photo has been posted');
	            });
		  }

    };
    FB.getLoginStatus(function(response){
       if(response.status!='connected'){
         FB.login(handleLogin,{scope:'publish_stream'});
       }else{
        handleLogin(response);
       }
    },true);
	});
	$('#button-imgur').button({});
	$('#button-imgur').click(function(){
    bikini.renderToHidden();
    $.blockUI();
		var url=hiddenCanvas.toDataURL("image/jpeg",95).split(',')[1];
		$.ajax({
      url: 'https://api.imgur.com/3/image',
      type: 'POST',
      headers: {
        Authorization: 'Client-ID 4a6948d9e91531c',
        Accept: 'application/json'
      },
      data: {
        image: url,
        type: 'base64'
      },
      success: function(result) {
        var id = result.data.id;
        $.unblockUI();
        window.location = 'https://imgur.com/gallery/' + id;
      }
    });
	});
	bikini.toggleMenu(0);
});